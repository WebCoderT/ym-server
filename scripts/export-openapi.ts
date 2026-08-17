import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from '../src/app.module';
import { buildSwaggerDocumentConfig, swaggerDomains } from '../src/config/swagger.config';
import { enrichWithStandaloneEnums } from './enrich-openapi';

async function exportOpenApi() {
  const app = await NestFactory.create(AppModule, { logger: false });
  const outDir = resolve(process.cwd(), 'openapi');

  mkdirSync(outDir, { recursive: true });

  for (const domain of swaggerDomains) {
    const document = SwaggerModule.createDocument(app, buildSwaggerDocumentConfig(domain), {
      include: domain.include,
    });

    // 注入独立枚举 schema，将内联 enum 替换为 $ref
    enrichWithStandaloneEnums(document);

    writeFileSync(resolve(outDir, domain.outputFile), JSON.stringify(document, null, 2));
  }

  await app.close();
}

exportOpenApi().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
