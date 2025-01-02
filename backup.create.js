const fs = require('fs');
const path = require('path');

// Carpetas a excluir
const EXCLUDED_FOLDERS = ['.next', 'node_modules', 'BACKUP'];

// Función para eliminar recursivamente un directorio
function deleteFolderRecursive(folderPath) {
    if (fs.existsSync(folderPath)) {
        fs.readdirSync(folderPath).forEach(item => {
            const currentPath = path.join(folderPath, item);
            if (fs.lstatSync(currentPath).isDirectory()) {
                deleteFolderRecursive(currentPath);
            } else {
                fs.unlinkSync(currentPath);
            }
        });
        fs.rmdirSync(folderPath);
    }
}

// Función para crear el backup
async function createBackup(sourcePath, backupPath) {
    try {
        // Eliminar carpeta BACKUP si existe
        console.log('Eliminando backup anterior...');
        deleteFolderRecursive(backupPath);

        // Crear nueva carpeta BACKUP
        console.log('Creando nueva carpeta de backup...');
        fs.mkdirSync(backupPath, { recursive: true });

        // Leer contenido del directorio
        const items = fs.readdirSync(sourcePath);

        for (const item of items) {
            const sourceItemPath = path.join(sourcePath, item);
            const backupItemPath = path.join(backupPath, item);

            // Verificar si es un directorio excluido
            if (EXCLUDED_FOLDERS.includes(item)) {
                continue;
            }

            const stats = fs.statSync(sourceItemPath);

            if (stats.isDirectory()) {
                // Si es directorio, crear recursivamente
                fs.mkdirSync(backupItemPath, { recursive: true });
                await createBackup(sourceItemPath, backupItemPath);
            } else {
                // Si es archivo, copiar
                fs.copyFileSync(sourceItemPath, backupItemPath);
            }
        }
    } catch (error) {
        console.error('Error durante el backup:', error);
    }
}

// Rutas
const projectRoot = process.cwd();
const backupFolder = path.join(projectRoot, 'BACKUP');

// Ejecutar el backup
console.log('Iniciando proceso de backup...');
createBackup(projectRoot, backupFolder)
    .then(() => console.log('¡Backup completado con éxito!'))
    .catch(error => console.error('Error al realizar el backup:', error));