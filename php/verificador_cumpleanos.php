<?php
/**
 * ============================================================================
 * VERIFICADOR DE CUMPLEAÑOS (Backend)
 * ============================================================================
 * Busca si algún contacto cumple años hoy y devuelve la lista en JSON.
 */

session_start();
require_once 'conexion.php';

// 1. IMPORTANTE: Desactivar reporte de errores visuales
// Esto evita que advertencias de XAMPP (como fallos de mail) se mezclen con el JSON
error_reporting(0); 
ini_set('display_errors', 0);

// Establecer cabecera JSON
header('Content-Type: application/json; charset=utf-8');

// 2. Seguridad: Verificar sesión
if (!isset($_SESSION['logueado']) || !$_SESSION['logueado']) {
    echo json_encode(['status' => 'error', 'message' => 'No autorizado']);
    exit;
}

$conn = obtenerConexion();

if (!$conn) {
    echo json_encode(['status' => 'error', 'message' => 'Error de conexión']);
    exit;
}

$email_usuario = $_SESSION['email']; 
$hoy_mes_dia = date('m-d'); // Obtiene fecha actual (Ej: '11-24')

// 3. Consulta SQL
// Busca contactos del usuario actual cuyo cumpleaños coincida con hoy (mes y día)
$stmt = $conn->prepare("
    SELECT nombre 
    FROM contacto 
    WHERE correo_usuario = ? 
    AND DATE_FORMAT(FCumple, '%m-%d') = ?
");

if (!$stmt) {
    echo json_encode(['status' => 'error', 'message' => 'Error en consulta SQL']);
    exit;
}

$stmt->bind_param("ss", $email_usuario, $hoy_mes_dia);
$stmt->execute();
$resultado = $stmt->get_result();

$cumpleaneros = [];

while ($fila = $resultado->fetch_assoc()) {
    $nombre = $fila['nombre'];
    
    // --- ENVÍO DE CORREO ---
    // COMENTADO para evitar errores en Localhost/XAMPP si no hay servidor de correo.
    // Si subes esto a un hosting real, puedes descomentar la línea de abajo.
    
    // mail($email_usuario, "¡Alerta de Cumpleaños!", "Hoy es el cumpleaños de: " . $nombre);
    
    // Guardamos el nombre en la lista para enviarlo al Frontend
    $cumpleaneros[] = $nombre;
}

$stmt->close();
cerrarConexion($conn);

// 4. Devolver respuesta JSON limpia
echo json_encode([
    'status' => 'success',
    'cumpleaneros' => $cumpleaneros
]);
?>