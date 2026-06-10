/**
 * Genera el contenido de libros.json desde la hoja activa.
 *
 * Formato de columnas esperado (desde la columna A):
 * A: portada (vacia en origen)
 * B: titulo
 * C: autor
 * D: genero
 * E: idioma
 * F: estado
 *
 * Se asume que la primera fila tiene encabezados.
 */
function generarLibrosJson() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var values = sheet.getDataRange().getValues();

  if (values.length <= 1) {
    throw new Error("No hay filas de datos para exportar.");
  }

  var dataRows = values.slice(1);

  var libros = dataRows
    .filter(function(row) {
      // Ignora filas completamente vacias
      return row.some(function(cell) {
        return String(cell).trim() !== "";
      });
    })
    .map(function(row) {
      var titulo = String(row[1] || "").trim(); // Columna B
      var tituloParaUrl = titulo.replace(/\s+/g, "");

      return {
        portada: "https://raw.githubusercontent.com/devmargen/catalogo/main/portadas/" + tituloParaUrl + ".jpg",
        titulo: titulo,
        autor: String(row[2] || "").trim(),   // Columna C
        genero: String(row[3] || "").trim(),  // Columna D
        idioma: String(row[4] || "").trim(),  // Columna E
        estado: String(row[5] || "").trim()   // Columna F
      };
    });

  var json = JSON.stringify(libros, null, 2);
  var logUrl = crearArchivoLogJsonEnDrive_(json);
  Logger.log("Log JSON guardado en Drive: " + logUrl);
  return json;
}

/**
 * Genera el JSON y lo guarda/actualiza como "libros.json" en Drive.
 */
function guardarLibrosJsonEnDrive() {
  var json = generarLibrosJson();
  var fileName = "libros.json";
  var files = DriveApp.getFilesByName(fileName);

  if (files.hasNext()) {
    var existingFile = files.next();
    existingFile.setContent(json);
    Logger.log("Archivo actualizado: " + existingFile.getUrl());
    return existingFile.getUrl();
  }

  var newFile = DriveApp.createFile(fileName, json, MimeType.PLAIN_TEXT);
  Logger.log("Archivo creado: " + newFile.getUrl());
  return newFile.getUrl();
}

/**
 * Crea un archivo de log en Drive con el JSON generado.
 * Siempre crea uno nuevo con timestamp para conservar historial.
 */
function crearArchivoLogJsonEnDrive_(json) {
  var tz = Session.getScriptTimeZone() || "America/Argentina/Buenos_Aires";
  var stamp = Utilities.formatDate(new Date(), tz, "yyyyMMdd-HHmmss");
  var logFileName = "log-libros-" + stamp + ".json";
  var logFile = DriveApp.createFile(logFileName, json, MimeType.PLAIN_TEXT);
  return logFile.getUrl();
}
