# Nest.js + Mongoose

This package provide a simple solution to create a CRUD controller for a MongoDB collection.

Support output format in Json:api, HAL, JSON+LD and JSON. _(Json:api, HAL are enabled by default)_

## Installation

### NPM

```sh
npm install @macfja/nestjs-mongoose
```
## Usage

### Nest Module

In your main module (i.e. `src/app.module.ts`) configure your MongooseModule.
Something similar to:
```ts
import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { CatController, DogController } from "./app.controller";
import { CatController, DogController } from "./cat/cat.controller";
import { Cat, CatSchema } from "./cat/cat.schema";
import { AppService } from "./app.service";

@Module({
    imports: [
        MongooseModule.forRoot("mongodb://root:root@localhost:27017/example?authSource=admin"),
        MongooseModule.forFeature([{ name: Cat.name, schema: CatSchema }]),
//                                         ^^^^^^^^
//                                         This value is important, it's what will be used to 
//                                         link the controller to the Mongoose Schema
    ],
    controllers: [AppController, CatController],
    providers: [AppService],
})
export class AppModule {}
```

### Mongoose Schema

Declare your mongoose schema as usual.

### Controller

In your controller (i.e. `src/cat/cat.controller.ts`)
```ts
import { MongooseControllerFactory } from "@macfja/nestjs-mongoose";
import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CatConverter } from "./cat.converter";
import { CatDto } from "./cat.dto";

@Controller("cats")
@ApiTags("Cat Api")
export class CatController extends MongooseControllerFactory(Cat.name, new CatConverter(), CatDto, CatDto, CatDto) {}
//                                                           ^^^^^^^^
//                                                           Same as the value of the MongooseModule.forFeature
```
To get the automatic CRUD controller, we need to extend the function `MongooseControllerFactory`, which take 6 parameters (the last one is optional):
```ts
declare function MongooseControllerFactory<Resource, Dto extends JsonObject, Searchable extends SimpleType, Creator extends JsonObject, Updater extends JsonObject>(
    modelInjectionName: string,
    converter: EntityConverter<Resource, Searchable, Dto, Creator, Updater>,
    dtoConstructor?: Type<Dto>,
    creatorConstructor?: Type<Creator>,
    updaterConstructor?: Type<Updater>,
    options?: MongooseControllerOptions<Dto, Creator, Updater>
): Type<MongooseController<Dto, Searchable, Creator, Updater>>;
```

- `modelInjectionName` is the name linked to the schema (same as declared in `MongooseModule.forFeature`)
- `converter` is the instance responsible to convert your DTO into Mongo Entity and vice-versa
- `dtoConstructor` is the class representation of one element of your collection that you want to return
  (if missing or `undefined`, it's the same as `options.disable.read: true`)
- `creatorConstructor` is the class representation of a new element to add to your collection that you want to receive
  (if missing or `undefined`, it's the same as `options.disable.create: true`)
- `updaterConstructor` is the class representation of one element to update in your collection that you want to receive
  (if missing or `undefined`, it's the same as `options.disable.update: true`)
- `options` is a set of configuration to change what the controller can do (more information later in this document).

### DTO

Let's see how the DTO (i.e. `src/cat/cat.dto.ts`) are:
```ts
import { BaseDto } from "@macfja/nestjs-mongoose";
import { ApiProperty } from "@nestjs/swagger";

export class CatDto extends BaseDto implements CatDtoType {
    constructor(name: string, breed: string, age: number) {
        super();
        this.name = name;
        this.breed = breed;
        this.age = age;
    }

    @ApiProperty()
    name: string;
    @ApiProperty()
    breed: string;
    @ApiProperty()
    age: number;
}
export type CatDtoType = {
    name: string;
    breed: string;
    age: number;
};

export type CatSearchableDto = {
    name?: string;
    breed?: string;
};
```
`BaseDto` is a helper class to ease the typing, and it's completely optional.

### Converter

Let's take a look on the converter (i.e. `src/cat/cat.converter.ts`):
```ts
import {
    type EntityConverter,
    type PartialWithId,
    type SearchField,
    toMongoFilterQuery,
    toMongoSort,
} from "@macfja/nestjs-mongoose";
import { type FilterQuery, type HydratedDocument, type SortOrder, Types } from "mongoose";
import { CatDto, type CatDtoType, type CatSearchableDto } from "./cat.dto";
import type { Cat } from "./cat.schema";

export class CatConverter implements EntityConverter<Cat, CatSearchableDto, CatDto> {
    fromDtoFields(fields?: Array<keyof CatDtoType>): Array<keyof Cat> {
        return fields
            ?.filter((field) => ["name", "age", "breed"].includes(field))
            .map((field) => {
                switch (field) {
                    case "name":
                        return "name";
                    case "age":
                        return "age";
                    case "breed":
                        return "breed";
                }
                return false;
            })
            .filter(Boolean) as Array<keyof Cat>;
    }
    fromDtoSort(sort?: Array<string>): Record<string, SortOrder> {
        return toMongoSort(sort ?? []);
    }
    toDto(input: HydratedDocument<Cat>): CatDto {
        return new CatDto(input.name, input.breed, input.age);
    }

    fromSearchable(input?: SearchField<CatSearchableDto>): FilterQuery<Cat> {
        return toMongoFilterQuery(input);
    }

    fromCreator(input: Partial<CatDtoType>): Partial<Cat> {
        return {
            ...input,
        };
    }

    fromUpdater(id: string, input: Partial<CatDtoType>): PartialWithId<Cat> {
        return {
            ...input,
            _id: new Types.ObjectId(id),
        };
    }
}
```

The converter do 6 transformation:
- `fromDtoFields()` allow you to define the list of field to select (`projection`) in the MongoDB query from the name of field of the DTO
- `fromDtoSort()` allow to set how the document are sorted. The parameter is a list of field name of the DTO (can be prefixed by `-` to reverse the order).
- `fromSearchable()` allow to change the filtering provided (**The operators are not exactly the same as MongoDB, set later in this document**)
- `fromCreator()` allow you to transform a creation DTO into a Mongoose entity data
- `fromUpdater()` allow you to transform a modification DTO into a Mongoose entity data
- `toDto()` allow you to transform a document from MongoDB into the DTO you want to display

`@macfja/nestjs-mongoose` come with all sort of helper to ease the creation of a converter:
- `toMongoFilterQuery()`: Transform a received filter into a MongoDB query filter
- `toMongoSort()`: Transform a list of field name and negate field name into a MongoDB sort parameter
- `class OneToOneConverter`: A preconfigured converter that output a MongoDB as is come from the database

---

With this you should have a functional CRUD for your MongoDB collection.

## Configuration

As mentioned earlier, `MongooseControllerFactory` has a 6th parameter to control how it's works:
```ts
type MongooseControllerOptions<Dto extends JsonObject, Creator extends JsonObject, Updater extends JsonObject> = Partial<{
    disable: Partial<{
        list: boolean;
        get: boolean;
        update: boolean;
        create: boolean;
        delete: boolean;
        read: boolean;
        write: boolean;
    }>;
    pageSize: Partial<{
        default: number;
        max: number;
    }>;
    urlResolver: ProblemDetailTypeUrlResolver;
    logger: LoggerService;
    resourceType: string;
    representations: Array<Representation<Dto, Creator, Updater>>;
    operators: typeof Operators;
    operatorValidator: Partial<{
        escapeInvalidLogicalOperator: boolean;
        throwOnInvalidOperator: boolean;
    }>;
}>;
```

- `disable`, It allow to remove some part of teh controller:
    - `list`: if `true`, the listing of document is removed from the controller (default: `false`)
    - `get`: if `true`, getting one document from its id is removed from the controller (default: `false`)
    - `update`: if `true`, updating one document is removed from the controller (default: `false`)
    - `create`: if `true`, creating a document is removed from the controller (default: `false`)
    - `delete`: if `true`, deleting one document from its id is removed from the controller (default: `false`)
    - `read`: if `true`, the listing and getting one document are removed from the controller, the output of the creation and modification of a document is disabled (default: `false`)
    - `writing`: if `true`, updating, creating and deleting a document are removed from the controller (default: `false`)
- `pageSize`, Allow to change the pagination size:
    - `default`, the default page size is none is provided (default: `10`)
    - `max`, the maximum page size allowed. If the value requested by the user is superior, it is set to this value  (default: `200`)
- `urlResolver`, The [`ProblemDetail`](https://github.com/sjfrhafe/nest-problem-details?tab=readme-ov-file#customize-auto-type-generation) error resolver (default: `undefined` => Resolve URL to `https://httpstatuses.com/`)
- `logger`, The logger to use. Used by `ProblemDetail` (default: `undefined` => no log)
- `resourceType`, The name of the resource to display in the outputs. Used for Json:Api, HAL (default: `undefined` => same as the `modelInjectionName` provided to the factory)
- `outputFormats`, The list of document representation standard to use (default: `[instance of JsonApi, instance of Hal]`)
- `operators`, List of operators to display in the swagger (default: `[ "$eq", "$neq", "$gt", "$gte", "$lt", "$lte", "$start", "$end", "$regex", "$null", "$def", "$in", "$nin", "$or", "$and" ]`)
- `operatorValidator`, defined how the operators parser/validator react on invalid value:
  - `escapeInvalidLogicalOperator`, if `true` and `$and` or `$or` are defined but not allowed, escape the operator (add `\` before the operator), otherwise use the same behavior defined by `throwOnInvalidOperator` (default: `false`)
  - `throwOnInvalidOperator`, if `true` and a not allowed operator is present, throw an 400 error, otherwise, remove the operator from the filter (default: `true`)

### Custom data representation (input and ouput)

The library come with 4 built-in representation:
- `JsonApi`, which implement the [`{json:api}` spec](https://jsonapi.org/) and support:
    - Get a list of document (Response)
    - Get one document (Response)
    - Update one document (Request)
    - Create one document (Request)
- `HAL`, which implement the [HAL spec](https://stateless.co/hal_specification.html) and support:
    - Get a list of document (Response)
    - Get one document (Response)
- `JsonLdFactory(context: string)`, which implement the [JSON-LD spec](https://json-ld.org/) with [Hydra spec for collection](https://www.hydra-cg.com/) and support:
    - Get a list of document (Response)
    - Get one document (Response)
- `SimpleJson`, which have a minimal encapsulation and support:
    - Get a list of document (Response)
    - Get one document (Response)
    - Update one document (Request)
    - Create one document (Request)

To create a new output format, you need an instance of `Representation`
```ts
type Representation<Dto extends JsonObject = any, Creator extends JsonObject = any, Updater extends JsonObject = any> = {
    readonly renderOne?: RenderOne<Dto>;
    readonly renderPage?: RenderPage<Dto>;
    readonly getOneResponseSwaggerExtension?: OneResponseSwaggerExtension<Dto>;
    readonly getCollectionResponseSwaggerExtension?: CollectionResponseSwaggerExtension<Dto>;
    readonly getCreateRequestSwaggerExtension?: CreateRequestSwaggerExtension<Creator>;
    readonly getUpdateRequestSwaggerExtension?: UpdateRequestSwaggerExtension<Updater>;
    readonly parseCreateRequest?: ParseCreate<Creator>;
    readonly parseUpdateRequest?: ParseUpdate<Updater>;
    readonly contentType: string;
};
```
The property `contentType` indicate the output MIME type of your representation, it is also use (with the `Accept` header, or `Content-type` header) to determine which representation to use.

- `RenderOne<Resource extends JsonObject> = (id: string, type: string, self: string, resource: Resource) => JsonObject`, this function is call to render a document
    - `id` is the MongoDB id of the document
    - `type` is the value of `resourceType` (or the value of `modelInjectionName`)
    - `self` is the URL pathname of the controller
    - `resource` is the DTO version of the MongoDB document
- `RenderPage<Resource extends JsonObject> = (type: string, self: string, count: number, pageData: { size: number; current: number; }, resources: Map<string, Resource>) => JsonObject`, this function is call to render a paginated list of documents
    - `type` is the value of `resourceType` (or the value of `modelInjectionName`)
    - `self` is the URL pathname of the controller
    - `pageData` is the current information about the page (the size of a page, and the current page number)
    - `resources` is list of item of the page. The key of the map is the MongoDB id of the document, the value the DTO version
- `ParseCreate<Creator extends JsonObject> = (input: JsonObject, type: string) => Creator | never`, this function extract the `Creator` resource from the representation
    - `input` is the JSON receive by the controller
    - `type` is the value of `resourceType` (or the value of `modelInjectionName`)
    - If an error occurs wil validating/parsing the input, a `ProblemDetailException` (or any exception) can be thrown
- `ParseUpdate<Updater extends JsonObject> = (input: JsonObject, type: string, id: string) => Updater | never`, this function extract the `Updater` resource from the representation
    - `input` is the JSON receive by the controller
    - `type` is the value of `resourceType` (or the value of `modelInjectionName`)
    - `id` is the identifier of the document to update
    - If an error occurs wil validating/parsing the input, a `ProblemDetailException` (or any exception) can be thrown

`OneResponseSwaggerExtension`, `CollectionResponseSwaggerExtension`, `CreateRequestSwaggerExtension`, `UpdateRequestSwaggerExtension` all extends the interface
```ts
type SwaggerExtensionMaker<Input extends JsonObject = JsonObject> = (
    attribute: Type<Input>,
    resourceType: string,
) => SwaggerSchemaExtension
```
- `attribute` is the class of a DTO
- `resourceType` is the value of `resourceType` (of the configuration), or the value of `modelInjectionName`

The functions return a `SwaggerSchemaExtension` to helper generate an accurate OpenApi document
```ts
interface SwaggerSchemaExtension {
    extraModels: Parameters<typeof ApiExtraModels>;
    schema: SchemaObject;
}
```
- `extraModels` List of class to inject in the OpenApi definition
- `schema` The linked OpenApi schema

## Override a route

You can change the behavior of a simple route by overriding it like a normal OOP class.

```ts
import { GetOneDecorator, Hal, JsonApi, type JsonObject, MongooseControllerFactory } from "@macfja/nestjs-mongoose";
import { Controller } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type e from "express";
import { CatConverter } from "./cat.converter";
import { CatDto } from "./cat.dto";
import { Cat } from "./cat.schema";

@Controller("cats")
@ApiTags("Cat Api")
export class CatController extends MongooseControllerFactory(Cat.name, new CatConverter(), CatDto, CatDto, CatDto) {
    @GetOneDecorator(CatDto, Cat.name, [JsonApi, Hal])
    override async getOne(response: e.Response, request: e.Request, id: string, fields?: unknown): Promise<JsonObject> {
        // Do something cool with the input params
        const result = await super.getOne(response, request, id, fields);
        // Do something cool with the output
        return result;
    }
}
```
The decorator `@GetOneDecorator` add all the annotation needed for the OpenApi documentation and the route declaration.

- use `@CreateOneDecorator`, for the creation route (controller method `createOne`)
- use `@DeleteOneDecorator`, for the removing route (controller method `deleteOne`)
- use `@UpdateOneDecorator`, for the modification route (controller method `updateOne`)
- use `@GetListDecorator`, for the listing route (controller method `getList`)
- use `@GetOneDecorator`, for the reading route (controller method `getOne`)

## Filter operator

This library is a slightly different list of operator

| `@macfja/nestjs-mongoose` | MongoDB                        |
|---------------------------|--------------------------------|
| `$eq`                     | `$eq`                          |
| `$neq`                    | `$ne`                          |
| `$gt`                     | `$gt`                          |
| `$gte`                    | `$gte`                         |
| `$lt`                     | `$lt`                          |
| `$lte`                    | `$lte`                         |
| `$start`                  | `$regex` with a altered value  |
| `$end`                    | `$regex` with a altered value  |
| `$regex`                  | `$regex`                       |
| `$null`                   | `$eq` with the value to `null` |
| `$def`                    | `$ne` with the value to `null` |
| `$in`                     | `$in`                          |
| `$nin`                    | `$nin`                         |
| `$or`                     | `$or`                          |
| `$and`                    | `$and`                         |

The library handle the case where several `$regex`, `$eq`, `$ne` would appear in the MongoDB request if the function `toMongoFilterQuery` is used
