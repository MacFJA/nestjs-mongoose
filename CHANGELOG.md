# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

## 0.3.0 - 2024-05-20

### Added

- Representation can now implement Create and Update request body
- JSON+LD representation (read)
- Simple JSON representation (read+write)
- List filter is now filtered
- New option to change the filter parsing behavior

### Changed

- rename option `outputFormats` to `representations`

## 0.2.0 - 2024-05-16

### Added

- List operators display in Swagger are configurable
- Setting the DTO to `undefined` is the same of `options.disable.read`
- Setting the Creator to `undefined` is the same of `options.disable.create`
- Setting the Updater to `undefined` is the same of `options.disable.update`

### Changed

- Move DTO, Creator, Updater to the end of the function parameters and make them optionals

## 0.1.0 - 2024-05-14

First version
