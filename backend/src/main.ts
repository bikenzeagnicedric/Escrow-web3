import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const configService = app.get(ConfigService);

    // Global prefix
    const apiPrefix = configService.get('API_PREFIX') || 'api/v1';
    app.setGlobalPrefix(apiPrefix);

    // CORS
    app.enableCors({
        origin: configService.get('CORS_ORIGIN') || 'http://localhost:3001',
        credentials: true,
    });

    // Global validation pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    // Swagger documentation
    if (configService.get('SWAGGER_ENABLED') === 'true') {
        const config = new DocumentBuilder()
            .setTitle('Smart Escrow API')
            .setDescription('Decentralized escrow platform with dispute resolution')
            .setVersion('1.0')
            .addTag('auth', 'Authentication endpoints')
            .addTag('escrows', 'Escrow management')
            .addTag('disputes', 'Dispute resolution')
            .addBearerAuth(
                {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    name: 'JWT',
                    description: 'Enter JWT token',
                    in: 'header',
                },
                'JWT-auth',
            )
            .build();

        const document = SwaggerModule.createDocument(app, config);
        const swaggerPath = configService.get('SWAGGER_PATH') || 'api/docs';
        SwaggerModule.setup(swaggerPath, app, document, {
            swaggerOptions: {
                persistAuthorization: true,
            },
        });

        console.log(`📚 Swagger documentation available at: /${swaggerPath}`);
    }

    const port = configService.get('PORT') || 3000;
    await app.listen(port);

    console.log(`🚀 Application is running on: http://localhost:${port}/${apiPrefix}`);
}

bootstrap();
