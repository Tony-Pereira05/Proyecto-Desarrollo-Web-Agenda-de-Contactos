<?php
session_start();
require_once 'conexion.php';

// Verificar que sea POST
if ($_SERVER["REQUEST_METHOD"] != "POST") {
    echo json_encode([
        'success' => false,
        'message' => 'Método no permitido'
    ]);
    exit;
}

// Obtener datos del formulario
$nombre = trim($_POST['nombre'] ?? '');
$email = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';

// ============================================================================
// VALIDACIONES
// ============================================================================

// Validar campos vacíos
if (empty($nombre) || empty($email) || empty($password)) {
    echo json_encode([
        'success' => false,
        'message' => 'Todos los campos son obligatorios'
    ]);
    exit;
}

// Validar formato de email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode([
        'success' => false,
        'message' => 'El formato del correo electrónico no es válido'
    ]);
    exit;
}

// Validar longitud de contraseña
if (strlen($password) < 6) {
    echo json_encode([
        'success' => false,
        'message' => 'La contraseña debe tener al menos 6 caracteres'
    ]);
    exit;
}

// ============================================================================
// CONEXIÓN A BASE DE DATOS
// ============================================================================

$conn = obtenerConexion();

if (!$conn) {
    echo json_encode([
        'success' => false,
        'message' => 'Error de conexión con el servidor. Intenta más tarde.'
    ]);
    exit;
}

$stmt = $conn->prepare("SELECT correo FROM usuario WHERE correo = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$resultado = $stmt->get_result();

if ($resultado->num_rows > 0) {
    $stmt->close();
    cerrarConexion($conn);
    
    echo json_encode([
        'success' => false,
        'message' => 'Este correo ya está registrado'
    ]);
    exit;
}
$stmt->close();

// ============================================================================
// HASHEAR CONTRASEÑA Y GUARDAR USUARIO
// ============================================================================

// Generar hash seguro de la contraseña
$password_hash = password_hash($password, PASSWORD_BCRYPT);

// Preparar consulta INSERT
$stmt = $conn->prepare("INSERT INTO usuario (correo, contraseña, nombre) VALUES (?, ?, ?)");
$stmt->bind_param("sss", $email, $password_hash, $nombre);

// Ejecutar inserción
if ($stmt->execute()) {
    // Éxito - Guardar email en sesión para posible auto-login
    $_SESSION['ultimo_registro'] = [
        'nombre' => $nombre,
        'email' => $email,
        'fecha' => date('Y-m-d H:i:s')
    ];
    
    $stmt->close();
    cerrarConexion($conn);
    
    echo json_encode([
        'success' => true,
        'message' => '¡Cuenta creada exitosamente!'
    ]);
} else {
    $stmt->close();
    cerrarConexion($conn);
    
    echo json_encode([
        'success' => false,
        'message' => 'Error al crear la cuenta. Intenta nuevamente.'
    ]);
}


