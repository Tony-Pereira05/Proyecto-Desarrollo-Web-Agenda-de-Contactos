<?php
/**
 * ============================================================================
 * CREAR NUEVO CONTACTO
 * ============================================================================
 */

session_start();
require_once 'conexion.php';

header('Content-Type: application/json');

// Verificar sesión
if (!isset($_SESSION['logueado']) || !$_SESSION['logueado']) {
    echo json_encode([
        'success' => false,
        'message' => 'Sesión no válida'
    ]);
    exit;
}

// Verificar método POST
if ($_SERVER["REQUEST_METHOD"] != "POST") {
    echo json_encode([
        'success' => false,
        'message' => 'Método no permitido'
    ]);
    exit;
}

// Obtener datos
$nombre = trim($_POST['nombre'] ?? '');
$telefono = trim($_POST['telefono'] ?? '');
$email = trim($_POST['email'] ?? '');
$fecha_cumple = trim($_POST['fecha_cumple'] ?? '');
$correo_usuario = $_SESSION['email'];

// ============================================================================
// VALIDACIONES
// ============================================================================

if (empty($nombre)) {
    echo json_encode([
        'success' => false,
        'message' => 'El nombre es obligatorio'
    ]);
    exit;
}

// Validar email si se proporcionó
if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        'success' => false,
        'message' => 'El formato del email no es válido'
    ]);
    exit;
}

// ============================================================================
// INSERTAR CONTACTO
// ============================================================================

$conn = obtenerConexion();

if (!$conn) {
    echo json_encode([
        'success' => false,
        'message' => 'Error de conexión'
    ]);
    exit;
}

// Preparar valores (convertir vacíos a NULL)
$telefono = !empty($telefono) ? $telefono : null;
$email = !empty($email) ? $email : null;
$fecha_cumple = !empty($fecha_cumple) ? $fecha_cumple : null;

$stmt = $conn->prepare("
    INSERT INTO contacto (nombre, telefono, correo, FCumple, correo_usuario) 
    VALUES (?, ?, ?, ?, ?)
");

$stmt->bind_param("sssss", $nombre, $telefono, $email, $fecha_cumple, $correo_usuario);

if ($stmt->execute()) {
    $nuevo_id = $conn->insert_id;
    
    $stmt->close();
    cerrarConexion($conn);
    
    echo json_encode([
        'success' => true,
        'message' => 'Contacto creado exitosamente',
        'id' => $nuevo_id
    ]);
} else {
    $stmt->close();
    cerrarConexion($conn);
    
    echo json_encode([
        'success' => false,
        'message' => 'Error al crear contacto'
    ]);
}