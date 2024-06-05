import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import type { HydratedDocument } from "mongoose";

export type CatDocument = HydratedDocument<Cat>;

@Schema({ collection: "cats" })
export class Cat {
	@Prop()
	name: string;

	@Prop()
	age: number;

	@Prop()
	breed: string;
}

export const CatSchema = SchemaFactory.createForClass(Cat);
