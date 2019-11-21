const _ = require('lodash')
const { parseMultipartData } = require('strapi-utils')

const uploadFiles = async (ctx, options) => {
  const { modelName, tempFieldName, fieldName, numMaxUploads } = options

  if (!ctx.is('multipart')) {
    return ctx.badRequest()
  }

  let filesField

  if (ctx.params.id) {
    const entity = await strapi.services[modelName].findOne({
      id: ctx.params.id,
      owner: ctx.state.user.id
    })
    if (!entity) {
      return ctx.badRequest()
    }
    filesField = entity[fieldName]
  } else {
    let userTemp = await strapi.services.temp.findOne({ owner: ctx.state.user.id })
    if (!userTemp) {
      userTemp = await strapi.services.temp.create({
        owner: ctx.state.user.id,
        [tempFieldName]: []
      })
    }
    filesField = userTemp[tempFieldName] || []
  }

  const uploadService = strapi.plugins.upload.services.upload;

  // Retrieve provider configuration.
  const config = await strapi
    .store({
      environment: strapi.config.environment,
      type: 'plugin',
      name: 'upload',
    })
    .get({ key: 'provider' });

  const { data, files: _files } = parseMultipartData(ctx)
  const files = _.castArray(_files.files || [])

  if (files.length > numMaxUploads) {
    return ctx.badRequest()
  }

  if (_.get(data, 'fileMetas.length', 0) > numMaxUploads) {
    return ctx.badRequest()
  }

  await Promise.all(_.get(data, 'fileMetas', []).map(async meta => {
    if (!_.has(meta, 'index')) {
      return ctx.badRequest()
    }
    if (meta.index >= numMaxUploads) {
      return ctx.badRequest()
    }
    // delete existing uploaded file
    if (filesField[meta.index] && (meta.delete || files[meta.fileIndex])) {
      await uploadService.remove(filesField[meta.index], config).catch(() => null)
      // eslint-disable-next-line require-atomic-updates
      filesField[meta.index] = null
    }

    // upload new file
    if (_.has(meta, 'fileIndex')) {
      const file = files[meta.fileIndex]

      // Transform stream files to buffer
      const buffers = await uploadService.bufferize([file]);
      if (buffers[0].size > config.sizeLimit) {
        return ctx.badRequest()
      }

      const uploads = await uploadService.upload([buffers[0]], config)
      // eslint-disable-next-line require-atomic-updates
      filesField[meta.index] = uploads[0]
    }
  }))

  // update backend file fields
  // update the temp field if it's a new record otherwise update the record
  if (ctx.params.id) {
    await strapi.services[modelName].update(
      { id: ctx.params.id, owner: ctx.state.user.id },
      { [fieldName]: filesField }
    )
  } else {
    await strapi.services.temp.update(
      { owner: ctx.state.user.id },
      { [tempFieldName]: filesField }
    )
  }

  return filesField
}

module.exports = {
  uploadFiles
}