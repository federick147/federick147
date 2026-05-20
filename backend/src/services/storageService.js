const { createClient } = require('@supabase/supabase-js');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Para operaciones del backend (subir/eliminar) se necesita la Service Role Key
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const BUCKET = process.env.SUPABASE_BUCKET || 'veris-imagenes';

// Sube un buffer/stream de imagen y devuelve la URL pública
async function subirImagen(buffer, mimetype, carpeta = 'cupones') {
  const extension = mimetype.split('/')[1] || 'jpg';
  const nombreArchivo = `${carpeta}/${uuidv4()}.${extension}`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(nombreArchivo, buffer, {
      contentType: mimetype,
      upsert: false,
    });

  if (error) throw new Error(`Error al subir imagen: ${error.message}`);

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(nombreArchivo);

  return urlData.publicUrl;
}

// Elimina una imagen por su URL pública
async function eliminarImagen(url) {
  const urlObj = new URL(url);
  // Extrae la ruta relativa después del nombre del bucket
  const rutaRelativa = urlObj.pathname.split(`/${BUCKET}/`)[1];
  if (!rutaRelativa) return;

  const { error } = await supabase.storage.from(BUCKET).remove([rutaRelativa]);
  if (error) console.warn('No se pudo eliminar imagen:', error.message);
}

module.exports = { subirImagen, eliminarImagen };
