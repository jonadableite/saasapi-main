// test-metadata-cleaner.js
// Script para testar a funcionalidade de limpeza de metadados

const fs = require('fs');
const path = require('path');

// Função para criar uma imagem de teste simples em base64
function createTestImage() {
  // Uma imagem JPEG mínima válida (1x1 pixel)
  const minimalJPEG = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00,
    0x01, 0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb,
    0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07,
    0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b,
    0x0b, 0x0c, 0x19, 0x12, 0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e,
    0x1d, 0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20, 0x22, 0x2c,
    0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34, 0x34,
    0x34, 0x1f, 0x27, 0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34,
    0x32, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01,
    0x01, 0x11, 0x00, 0x02, 0x11, 0x01, 0x03, 0x11, 0x01, 0xff, 0xc4,
    0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xff, 0xc4,
    0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xda,
    0x00, 0x0c, 0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3f,
    0x00, 0x8a, 0x00, 0x07, 0xff, 0xd9,
  ]);

  return minimalJPEG.toString('base64');
}

// Função para testar a API
async function testMetadataCleaner() {
  const baseURL = 'http://localhost:9000';
  const testImage = createTestImage();

  console.log(
    '🧪 Testando funcionalidade de limpeza de metadados...\n',
  );

  try {
    // Teste 1: Obter tipos suportados
    console.log(
      '1️⃣ Testando GET /api/metadata-cleaner/supported-types',
    );
    const supportedTypesResponse = await fetch(
      `${baseURL}/api/metadata-cleaner/supported-types`,
    );
    const supportedTypes = await supportedTypesResponse.json();

    if (supportedTypes.success) {
      console.log('✅ Tipos suportados obtidos com sucesso');
      console.log('📋 Tipos de mídia suportados:');
      supportedTypes.data.supportedTypes.forEach((type) => {
        console.log(
          `   - ${type.type}: ${type.mimetypes.join(', ')}`,
        );
      });
    } else {
      console.log(
        '❌ Erro ao obter tipos suportados:',
        supportedTypes.error,
      );
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Teste 2: Testar limpeza de imagem
    console.log(
      '2️⃣ Testando POST /api/metadata-cleaner/test (imagem)',
    );
    const testResponse = await fetch(
      `${baseURL}/api/metadata-cleaner/test`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64Data: testImage,
          fileName: 'test-image.jpg',
          mimetype: 'image/jpeg',
        }),
      },
    );

    const testResult = await testResponse.json();

    if (testResult.success) {
      console.log('✅ Limpeza de metadados realizada com sucesso!');
      console.log('📊 Estatísticas:');
      console.log(
        `   - Tamanho original: ${testResult.data.originalSize} bytes`,
      );
      console.log(
        `   - Tamanho limpo: ${testResult.data.cleanedSize} bytes`,
      );
      console.log(
        `   - Redução: ${testResult.data.reduction} bytes (${testResult.data.reductionPercentage}%)`,
      );
      console.log(
        `   - Arquivo limpo: ${testResult.data.cleanedMedia.fileName}`,
      );
    } else {
      console.log(
        '❌ Erro na limpeza de metadados:',
        testResult.error,
      );
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // Teste 3: Testar tipo não suportado
    console.log('3️⃣ Testando tipo de mídia não suportado');
    const unsupportedResponse = await fetch(
      `${baseURL}/api/metadata-cleaner/test`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base64Data: 'dGVzdA==', // "test" em base64
          fileName: 'test.pdf',
          mimetype: 'application/pdf',
        }),
      },
    );

    const unsupportedResult = await unsupportedResponse.json();

    if (!unsupportedResult.success) {
      console.log('✅ Erro esperado para tipo não suportado');
      console.log(`   - Erro: ${unsupportedResult.error}`);
    } else {
      console.log(
        '❌ Tipo não suportado foi processado (inesperado)',
      );
    }

    console.log('\n' + '='.repeat(50) + '\n');
    console.log('🎉 Testes concluídos!');
  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
    console.log(
      '\n💡 Certifique-se de que o servidor está rodando em http://localhost:9000',
    );
  }
}

// Função para testar integração com o dispatcher
function testDispatcherIntegration() {
  console.log('\n🔧 Testando integração com o dispatcher...\n');

  const dispatcherFile = path.join(
    __dirname,
    'src',
    'services',
    'campaign-dispatcher.service.ts',
  );

  if (fs.existsSync(dispatcherFile)) {
    const content = fs.readFileSync(dispatcherFile, 'utf8');

    // Verificar se a integração está presente
    const hasImport = content.includes(
      'import { metadataCleanerService }',
    );
    const hasCleanCall = content.includes(
      'metadataCleanerService.cleanMediaMetadata',
    );
    const hasCleanResult = content.includes(
      'cleanResult.cleanedMedia',
    );

    console.log('📋 Verificações de integração:');
    console.log(`   - Import do serviço: ${hasImport ? '✅' : '❌'}`);
    console.log(
      `   - Chamada de limpeza: ${hasCleanCall ? '✅' : '❌'}`,
    );
    console.log(
      `   - Uso do resultado: ${hasCleanResult ? '✅' : '❌'}`,
    );

    if (hasImport && hasCleanCall && hasCleanResult) {
      console.log('\n✅ Integração com o dispatcher está correta!');
    } else {
      console.log(
        '\n❌ Integração com o dispatcher precisa ser verificada.',
      );
    }
  } else {
    console.log('❌ Arquivo do dispatcher não encontrado');
  }
}

// Executar testes
async function runTests() {
  console.log(
    '🚀 Iniciando testes da funcionalidade de limpeza de metadados\n',
  );

  await testMetadataCleaner();
  testDispatcherIntegration();

  console.log(
    '\n📚 Para mais informações, consulte: METADATA_CLEANER_README.md',
  );
}

// Executar se chamado diretamente
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testMetadataCleaner, testDispatcherIntegration };
