<?php
/**
 * ============================================================================
 * ELIMINAR CONTACTO - VERSIÓN CON DEBUG
 * ============================================================================
 */

// Activar reporte de errores para debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

session_start();
require_once 'conexion.php';

header('Content-Type: application/json');

// Log de debugging
error_log("=== ELIMINAR CONTACTO ===");
error_log("POST data: " . print_r($_POST, true));
error_log("SESSION data: " . print_r($_SESSION, true));

// Verificar sesión
if (!isset($_SESSION['logueado']) || !$_SESSION['logueado']) {
    error_log("ERROR: Sesión no válida");
    echo json_encode([
        'success' => false,
        'message' => 'Sesión no válida'
    ]);
    exit;
}

// Verificar método POST
if ($_SERVER["REQUEST_METHOD"] != "POST") {
    error_log("ERROR: Método no permitido");
    echo json_encode([
        'success' => false,
        'message' => 'Método no permitido'
    ]);
    exit;
}

// Obtener ID
$id = isset($_POST['id']) ? (int)$_POST['id'] : 0;
$correo_usuario = $_SESSION['email'] ?? '';

error_log("ID a eliminar: $id");
error_log("Usuario: $correo_usuario");

if ($id <= 0) {
    error_log("ERROR: ID inválido");
    echo json_encode([
        'success' => false,
        'message' => 'ID de contacto inválido'
    ]);
    exit;
}

// ============================================================================
// ELIMINAR CONTACTO
// ============================================================================

$conn = obtenerConexion();

if (!$conn) {
    error_log("ERROR: No se pudo conectar a la base de datos");
    echo json_encode([
        'success' => false,
        'message' => 'Error de conexión con la base de datos'
    ]);
    exit;
}

error_log("Ejecutando DELETE para ID: $id, Usuario: $correo_usuario");

// IMPORTANTE: Solo eliminar si pertenece al usuario logueado
$stmt = $conn->prepare("DELETE FROM contacto WHERE id = ? AND correo_usuario = ?");

if (!$stmt) {
    error_log("ERROR: Prepare failed - " . $conn->error);
    echo json_encode([
        'success' => false,
        'message' => 'Error al preparar consulta'
    ]);
    cerrarConexion($conn);
    exit;
}

$stmt->bind_param("is", $id, $correo_usuario);

if ($stmt->execute()) {
    $affected = $stmt->affected_rows;
    error_log("Filas afectadas: $affected");
    
    if ($affected > 0) {
        $stmt->close();
        cerrarConexion($conn);
        
        echo json_encode([
            'success' => true,
            'message' => 'Contacto eliminado exitosamente'
        ]);
    } else {
        // Verificar si el contacto existe
        $check_stmt = $conn->prepare("SELECT id, correo_usuario FROM contacto WHERE id = ?");
        $check_stmt->bind_param("i", $id);
        $check_stmt->execute();
        $result = $check_stmt->get_result();
        
        if ($result->num_rows === 0) {
            error_log("ERROR: Contacto no existe - ID: $id");
            $mensaje = 'No se encontró el contacto';
        } else {
            $row = $result->fetch_assoc();
            error_log("Contacto existe pero pertenece a: " . $row['correo_usuario']);
            $mensaje = 'No tienes permisos para eliminar este contacto';
        }
        
        $check_stmt->close();
        $stmt->close();
        cerrarConexion($conn);
        
        echo json_encode([
            'success' => false,
            'message' => $mensaje
        ]);
    }
} else {
    error_log("ERROR: Execute failed - " . $stmt->error);
    $stmt->close();
    cerrarConexion($conn);
    
    echo json_encode([
        'success' => false,
        'message' => 'Error al eliminar contacto: ' . $conn->error
    ]);
}
?>