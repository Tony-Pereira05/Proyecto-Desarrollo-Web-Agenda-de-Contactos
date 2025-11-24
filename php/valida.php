<?php
/**
 * ============================================================================
 * VALIDACIÓN DE LOGIN - IMPLEMENTACIÓN CON BASE DE DATOS
 * ============================================================================
 * Valida credenciales contra la tabla 'usuario'
 * Verifica hash de contraseña con password_verify()
 */

session_start();
require_once 'conexion.php';

// Cabecera JSON
header('Content-Type: application/json');

// Verificar método POST
if ($_SERVER["REQUEST_METHOD"] != "POST") {
    echo json_encode([
        'success' => false,
        'message' => 'Método no permitido'
    ]);
    exit;
}

// Obtener credenciales
$email = trim($_POST['email'] ?? '');
$contrasena = $_POST['contrasena'] ?? '';

// ============================================================================
// VALIDACIONES BÁSICAS
// ============================================================================

if (empty($email) || empty($contrasena)) {
    echo json_encode([
        'success' => false,
        'message' => 'Email y contraseña son obligatorios'
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
        'message' => 'Error de conexión con el servidor'
    ]);
    exit;
}

// ============================================================================
// BUSCAR USUARIO EN LA BASE DE DATOS
// ============================================================================

$stmt = $conn->prepare("SELECT correo, contraseña, nombre FROM usuario WHERE correo = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$resultado = $stmt->get_result();

// Verificar si el usuario existe
if ($resultado->num_rows === 0) {
    $stmt->close();
    cerrarConexion($conn);
    
    echo json_encode([
        'success' => false,
        'message' => 'Correo o contraseña incorrectos'
    ]);
    exit;
}

// Obtener datos del usuario
$usuario = $resultado->fetch_assoc();
$stmt->close();
cerrarConexion($conn);

// ============================================================================
// VERIFICAR CONTRASEÑA
// ============================================================================

// password_verify() compara la contraseña con el hash
if (password_verify($contrasena, $usuario['contraseña'])) {
    // CREDENCIALES CORRECTAS
    
    // Guardar datos en sesión
    $_SESSION['email'] = $usuario['correo'];
    $_SESSION['nombre'] = $usuario['nombre'];
    $_SESSION['logueado'] = true;
    
    echo json_encode([
        'success' => true,
        'message' => '¡Bienvenido!',
        'nombre' => $usuario['nombre']
    ]);
} else {
    //  CONTRASEÑA INCORRECTA
    echo json_encode([
        'success' => false,
        'message' => 'Correo o contraseña incorrectos'
    ]);
}