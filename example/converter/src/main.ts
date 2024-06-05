import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
	const app = await NestFactory.create<NestExpressApplication>(AppModule);

	const config = new DocumentBuilder()
		.setTitle("Cats example")
		.setDescription("The cats API description")
		.setVersion("1.0")
		.build();
	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup("api", app, document);

	await app.listen(process.env.PORT || 3000);
}
bootstrap();
