/* eslint-disable */

import axios from 'axios';

/**
 * Faz merge do schema OpenAPI do Better Auth ao documento Swagger
 * Aguarda o servidor estar pronto e então faz a requisição
 */
export async function mergeBetterAuthToSwagger(
  document: any,
  port: number = 8080,
  maxRetries: number = 10,
  delayMs: number = 500,
): Promise<void> {
  const baseUrl = `http://localhost:${port}/api/auth/open-api/generate-schema`;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const { data: betterAuthSpec } = await axios.get(baseUrl, {
        timeout: 5000,
      });

      // Merge dos paths com tag "auth"
      if (betterAuthSpec?.paths) {
        const pathsWithAuthTag: Record<string, any> = {};
        for (const [pathKey, pathValue] of Object.entries(
          betterAuthSpec.paths,
        )) {
          // Adiciona o prefixo /api/auth aos paths
          const fullPath = `/api/auth${pathKey}`;
          pathsWithAuthTag[fullPath] = {};
          for (const [method, methodValue] of Object.entries(
            pathValue as any,
          )) {
            pathsWithAuthTag[fullPath][method] = {
              ...(methodValue as any),
              tags: ['Auth'],
            };
          }
        }
        document.paths = {
          ...document.paths,
          ...pathsWithAuthTag,
        };
      }

      // Merge dos schemas
      if (betterAuthSpec?.components?.schemas) {
        document.components = {
          ...document.components,
          schemas: {
            ...document.components?.schemas,
            ...betterAuthSpec.components.schemas,
          },
        };
      }

      // Merge das security schemes
      if (betterAuthSpec?.components?.securitySchemes) {
        document.components.securitySchemes = {
          ...document.components?.securitySchemes,
          ...betterAuthSpec.components.securitySchemes,
        };
      }

      // Adiciona a tag "Auth" se não existir
      if (!document.tags) {
        document.tags = [];
      }
      if (!document.tags.find((tag: any) => tag.name === 'Auth')) {
        document.tags.push({
          name: 'Auth',
          description: 'Autenticação com Better Auth',
        });
      }

      console.log('✅ Schema OpenAPI do Better Auth merged com sucesso!');
      return;
    } catch (error) {
      if (i < maxRetries - 1) {
        console.log(
          `⏳ Tentando conectar ao Better Auth... (${i + 1}/${maxRetries})`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  console.warn(
    '⚠️ Não foi possível fazer merge do schema Better Auth ao Swagger',
  );
}
