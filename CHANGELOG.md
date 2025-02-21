# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

## 1.0.0 - 2024-06-22

### Added

- (doc) Example on override 
- Add missing parameters in the controller interface

### Changed

- Improve README

### Fixed

- Typo

### Removed

- (doc) Remove old example

## 0.5.0 - 2024-06-16

### Added

- Add options to change fields to use in projection
- More description in Swagger
- Add information about the version of the generated OpenApi documentation

### Fixed

- Missing definition for some Error in Swagger
- Some typo in documentation
- Fix Swagger for sort (missing `-` prefix variant)
- Fix Collection renderer of JSON-LD

## 0.4.0 - 2024-06-05

### Added

- Filter can now match nested document (dot notation)
- List of projection (field to display) can now be configured and nested (dot notation)
- List of sortable field can now be configured and nested (dot notation)
- More JSDoc/TSDoc documentation

### Changed

- Remove Searchable type
- Improve List filter handling
- move `operators` and `operatorValidator` factory options into a dedicate option node (`filter`)

### Fixed

- Remove forgotten `console.log`

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
