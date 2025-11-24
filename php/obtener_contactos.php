<?php
/**
 * ============================================================================
 * OBTENER CONTACTOS DEL USUARIO LOGUEADO
 * ============================================================================
 * Retorna lista de contactos en formato JSON
 */

session_start();
require_once 'conexion.php';

// Cabecera JSON
header('Content-Type: application/json');

// Verificar sesión activa
if (!isset($_SESSION['logueado']) || !$_SESSION['logueado']) {
    echo json_encode([
        'success' => false,
        'message' => 'Sesión no válida'
    ]);
    exit;
}

// ============================================================================
// OBTENER CONTACTOS
// ============================================================================

$conn = obtenerConexion();

if (!$conn) {
    echo json_encode([
        'success' => false,
        'message' => 'Error de conexión'
    ]);
    exit;
}

$email_usuario = $_SESSION['email'];

// Consulta preparada para obtener solo contactos del usuario logueado
$stmt = $conn->prepare("
    SELECT id, nombre, telefono, correo, FCumple 
    FROM contacto 
    WHERE correo_usuario = ?
    ORDER BY nombre ASC
");

$stmt->bind_param("s", $email_usuario);
$stmt->execute();
$resultado = $stmt->get_result();

// Construir array de contactos
$contactos = [];
while ($fila = $resultado->fetch_assoc()) {
    $contactos[] = [
        'id' => (int)$fila['id'],
        'nombre' => $fila['nombre'],
        'telefono' => $fila['telefono'] ? (int)$fila['telefono'] : null,
        'email' => $fila['correo'],
        'fecha_cumple' => $fila['FCumple']
    ];
}

$stmt->close();
cerrarConexion($conn);

// Retornar contactos
echo json_encode([
    'success' => true,
    'contactos' => $contactos
]);