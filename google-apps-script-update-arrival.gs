const DEFAULT_SPREADSHEET_ID = '1nbT7zmyVLURL-O7N3W3tSj2xZEdwBgYlpd9JKEzCZzg';
const DEFAULT_SHEET_NAME = 'Pedidos';

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const token = String(body.token || '').trim();
    const expectedToken = PropertiesService.getScriptProperties().getProperty('INTERNAL_TOKEN');

    if (!expectedToken || token !== expectedToken) {
      return jsonResponse({ ok: false, error: 'unauthorized' });
    }

    const spreadsheetId = String(body.spreadsheetId || DEFAULT_SPREADSHEET_ID).trim();
    const sheetName = String(body.sheetName || DEFAULT_SHEET_NAME).trim();
    const orderNumber = String(body.orderNumber || '').trim();
    const partNumber = String(body.partNumber || '').trim();
    const chegada = String(body.chegada || '').trim();

    if (!spreadsheetId || !sheetName || !orderNumber || !partNumber || !chegada) {
      return jsonResponse({ ok: false, error: 'missing-required-fields' });
    }

    const sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(sheetName);
    if (!sheet) {
      return jsonResponse({ ok: false, error: 'sheet-not-found' });
    }

    const values = sheet.getDataRange().getValues();
    if (!values || values.length === 0) {
      return jsonResponse({ ok: false, error: 'empty-sheet' });
    }

    const headers = values[0].map((value) => normalizeHeader(value));
    const pedidoCol = headers.indexOf('PEDIDO');
    const partNumberCol = headers.indexOf('PARTNUMBER');
    const chegadaCol = headers.indexOf('CHEG');

    if (pedidoCol === -1 || partNumberCol === -1 || chegadaCol === -1) {
      return jsonResponse({ ok: false, error: 'required-headers-not-found' });
    }

    const normalizedOrderNumber = normalizeLookupValue(orderNumber);
    const normalizedPartNumber = normalizeLookupValue(partNumber);
    const orderMatches = [];

    for (let rowIndex = 1; rowIndex < values.length; rowIndex += 1) {
      const rowOrderNumber = String(values[rowIndex][pedidoCol] || '').trim();
      const rowPartNumber = String(values[rowIndex][partNumberCol] || '').trim();
      const normalizedRowOrderNumber = normalizeLookupValue(rowOrderNumber);
      const normalizedRowPartNumber = normalizeLookupValue(rowPartNumber);

      if (normalizedRowOrderNumber !== normalizedOrderNumber) {
        continue;
      }

      orderMatches.push({
        rowIndex,
        rowOrderNumber,
        rowPartNumber,
        normalizedRowPartNumber,
      });

      if (normalizedRowPartNumber === normalizedPartNumber) {
        return updateChegadaCell(sheet, rowIndex, chegadaCol, chegada, spreadsheetId, sheetName);
      }
    }

    if (orderMatches.length === 1) {
      return updateChegadaCell(
        sheet,
        orderMatches[0].rowIndex,
        chegadaCol,
        chegada,
        spreadsheetId,
        sheetName,
      );
    }

    return jsonResponse({
      ok: false,
      error: 'row-not-found',
      debug: {
        orderNumber,
        partNumber,
        orderMatches: orderMatches.length,
      },
    });
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: String(error && error.message ? error.message : error),
    });
  }
}

function updateChegadaCell(sheet, rowIndex, chegadaCol, chegada, spreadsheetId, sheetName) {
  const targetCell = sheet.getRange(rowIndex + 1, chegadaCol + 1);
  targetCell.setValue(chegada);
  SpreadsheetApp.flush();

  return jsonResponse({
    ok: true,
    row: rowIndex + 1,
    spreadsheetId,
    sheetName,
  });
}

function normalizeHeader(value) {
  return String(value || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[.\-_/]/g, ' ')
    .replace(/\s+/g, '')
    .trim();
}

function normalizeLookupValue(value) {
  return String(value || '')
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
    .trim();
}

function jsonResponse(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
