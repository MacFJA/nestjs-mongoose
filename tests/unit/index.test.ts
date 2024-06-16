import { type ExceptionFilter, Logger } from "@nestjs/common";
import { EXCEPTION_FILTERS_METADATA } from "@nestjs/common/constants.js";
import { ApiProperty } from "@nestjs/swagger";
import type { Request, Response } from "express";
import sinon from "sinon";
import { BaseDto, MongooseControllerFactory, OneToOneConverter } from "../../src/index.js";
import { testFunction } from "../_helpers.js";

class DTO extends BaseDto<{ foo: string }> {
	@ApiProperty({ type: String })
	foo = "";
}

testFunction(MongooseControllerFactory, "With options.disable.list", (t) => {
	const controller = MongooseControllerFactory("test", new OneToOneConverter<DTO>(), DTO, DTO, DTO, {
		disable: {
			list: true,
		},
	});
	t.is(typeof controller.prototype.getList, "undefined");
	t.is(typeof controller.prototype.getOne, "function");
	t.is(typeof controller.prototype.createOne, "function");
	t.is(typeof controller.prototype.updateOne, "function");
	t.is(typeof controller.prototype.deleteOne, "function");
});
testFunction(MongooseControllerFactory, "With options.disable.get", (t) => {
	const controller = MongooseControllerFactory("test", new OneToOneConverter<DTO>(), DTO, DTO, DTO, {
		disable: {
			get: true,
		},
	});
	t.is(typeof controller.prototype.getList, "function");
	t.is(typeof controller.prototype.getOne, "undefined");
	t.is(typeof controller.prototype.createOne, "function");
	t.is(typeof controller.prototype.updateOne, "function");
	t.is(typeof controller.prototype.deleteOne, "function");
});
testFunction(MongooseControllerFactory, "With options.disable.update", (t) => {
	const controller = MongooseControllerFactory("test", new OneToOneConverter<DTO>(), DTO, DTO, DTO, {
		disable: {
			update: true,
		},
	});
	t.is(typeof controller.prototype.getList, "function");
	t.is(typeof controller.prototype.getOne, "function");
	t.is(typeof controller.prototype.createOne, "function");
	t.is(typeof controller.prototype.updateOne, "undefined");
	t.is(typeof controller.prototype.deleteOne, "function");
});
testFunction(MongooseControllerFactory, "With options.disable.create", (t) => {
	const controller = MongooseControllerFactory("test", new OneToOneConverter<DTO>(), DTO, DTO, DTO, {
		disable: {
			create: true,
		},
	});
	t.is(typeof controller.prototype.getList, "function");
	t.is(typeof controller.prototype.getOne, "function");
	t.is(typeof controller.prototype.createOne, "undefined");
	t.is(typeof controller.prototype.updateOne, "function");
	t.is(typeof controller.prototype.deleteOne, "function");
});
testFunction(MongooseControllerFactory, "With options.disable.delete", (t) => {
	const controller = MongooseControllerFactory("test", new OneToOneConverter<DTO>(), DTO, DTO, DTO, {
		disable: {
			delete: true,
		},
	});
	t.is(typeof controller.prototype.getList, "function");
	t.is(typeof controller.prototype.getOne, "function");
	t.is(typeof controller.prototype.createOne, "function");
	t.is(typeof controller.prototype.updateOne, "function");
	t.is(typeof controller.prototype.deleteOne, "undefined");
});
testFunction(MongooseControllerFactory, "With options.disable.read", (t) => {
	const controller = MongooseControllerFactory("test", new OneToOneConverter<DTO>(), DTO, DTO, DTO, {
		disable: {
			read: true,
		},
	});
	t.is(typeof controller.prototype.getList, "undefined");
	t.is(typeof controller.prototype.getOne, "undefined");
	t.is(typeof controller.prototype.createOne, "function");
	t.is(typeof controller.prototype.updateOne, "function");
	t.is(typeof controller.prototype.deleteOne, "function");
});
testFunction(MongooseControllerFactory, "With options.disable.write", (t) => {
	const controller = MongooseControllerFactory("test", new OneToOneConverter<DTO>(), DTO, DTO, DTO, {
		disable: {
			write: true,
		},
	});
	t.is(typeof controller.prototype.getList, "function");
	t.is(typeof controller.prototype.getOne, "function");
	t.is(typeof controller.prototype.createOne, "undefined");
	t.is(typeof controller.prototype.updateOne, "undefined");
	t.is(typeof controller.prototype.deleteOne, "undefined");
});
testFunction(MongooseControllerFactory, "With no DTO", (t) => {
	const controller = MongooseControllerFactory("test", new OneToOneConverter<DTO>(), undefined, DTO, DTO);
	t.is(typeof controller.prototype.getList, "undefined");
	t.is(typeof controller.prototype.getOne, "undefined");
	t.is(typeof controller.prototype.createOne, "function");
	t.is(typeof controller.prototype.updateOne, "function");
	t.is(typeof controller.prototype.deleteOne, "function");
});
testFunction(MongooseControllerFactory, "With no updater", (t) => {
	const controller = MongooseControllerFactory("test", new OneToOneConverter<DTO>(), DTO, DTO, undefined);
	t.is(typeof controller.prototype.getList, "function");
	t.is(typeof controller.prototype.getOne, "function");
	t.is(typeof controller.prototype.createOne, "function");
	t.is(typeof controller.prototype.updateOne, "undefined");
	t.is(typeof controller.prototype.deleteOne, "function");
});
testFunction(MongooseControllerFactory, "With no creator", (t) => {
	const controller = MongooseControllerFactory("test", new OneToOneConverter<DTO>(), DTO, undefined, DTO);
	t.is(typeof controller.prototype.getList, "function");
	t.is(typeof controller.prototype.getOne, "function");
	t.is(typeof controller.prototype.createOne, "undefined");
	t.is(typeof controller.prototype.updateOne, "function");
	t.is(typeof controller.prototype.deleteOne, "function");
});

testFunction(MongooseControllerFactory, "With logger", (t) => {
	const logger = new Logger();
	const controller = MongooseControllerFactory("test", new OneToOneConverter<DTO>(), DTO, DTO, DTO, {
		logger,
	});
	const filters = Reflect.getMetadata(EXCEPTION_FILTERS_METADATA, controller) as Array<ExceptionFilter>;
	t.is((filters[0] as unknown as { logger: Logger | undefined }).logger, logger);
});

testFunction(MongooseControllerFactory, "Get List", async (t) => {
	const controller = MongooseControllerFactory("test", new OneToOneConverter<DTO>(), DTO, DTO, DTO);
	const findExec = sinon.stub().returns([
		{ _id: 4, foo: "baz" },
		{ _id: 5, foo: "baz" },
		{ _id: 6, foo: "baz" },
		{ _id: 7, foo: "baz" },
	]);
	const countExec = sinon.stub().returns(12);
	const find = sinon.stub().returns({ exec: findExec });
	const countDocuments = sinon.stub().returns({ exec: countExec });
	const response = {
		contentType: sinon.stub(),
	};
	const instance = new controller({
		find,
		countDocuments,
	});
	const result = await instance.getList?.(
		response as unknown as Response,
		{
			url: "foo/bar",
		} as unknown as Request,
		{
			foo: { $eq: "baz" },
		},
		{
			number: 2,
			size: 4,
		},
		["foo"],
		["-foo"],
	);

	t.deepEqual(result, {
		data: [
			{
				attributes: {
					_id: 4,
					foo: "baz",
				},
				id: 4,
				type: "test",
			},
			{
				attributes: {
					_id: 5,
					foo: "baz",
				},
				id: 5,
				type: "test",
			},
			{
				attributes: {
					_id: 6,
					foo: "baz",
				},
				id: 6,
				type: "test",
			},
			{
				attributes: {
					_id: 7,
					foo: "baz",
				},
				id: 7,
				type: "test",
			},
		],
		links: {
			first: "/foo/bar?page%5Bnumber%5D=1&page%5Bsize%5D=4",
			last: "/foo/bar?page%5Bnumber%5D=3&page%5Bsize%5D=4",
			next: "/foo/bar?page%5Bnumber%5D=3&page%5Bsize%5D=4",
			prev: "/foo/bar?page%5Bnumber%5D=1&page%5Bsize%5D=4",
			self: "/foo/bar?page%5Bnumber%5D=2&page%5Bsize%5D=4",
		},
		meta: {
			page: {
				count: 3,
				current: 2,
				size: 4,
			},
			totalCount: 12,
		},
	});
	t.true(findExec.called);
	t.true(countExec.called);
	t.true(response.contentType.called);
	t.is(response.contentType.firstCall.firstArg, "application/vnd.api+json");
});

testFunction(MongooseControllerFactory, "Get One", async (t) => {
	const controller = MongooseControllerFactory("test", new OneToOneConverter<DTO>(), DTO, DTO, DTO);
	const findExec = sinon.stub().returns({ _id: 4, foo: "baz" });
	const findById = sinon.stub().returns({ exec: findExec });
	const response = {
		contentType: sinon.stub(),
	};
	const instance = new controller({
		findById,
	});
	const result = await instance.getOne?.(
		response as unknown as Response,
		{
			url: "foo/bar/4",
		} as unknown as Request,
		"4",
		["foo"],
	);

	t.deepEqual(result, {
		data: {
			attributes: {
				_id: 4,
				foo: "baz",
			},
			id: "4",
			type: "test",
		},
		links: {
			self: "/foo/bar/4",
		},
	});
	t.true(findExec.called);
	t.true(response.contentType.called);
	t.is(response.contentType.firstCall.firstArg, "application/vnd.api+json");
});
