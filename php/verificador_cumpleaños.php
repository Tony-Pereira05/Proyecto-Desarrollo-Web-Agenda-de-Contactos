<?php
// Archivo: code/php/verificar_cumples_al_instante.php

session_start();
require_once 'conexion.php';
header('Content-Type: application/json');

// 1. Seguridad: Si no está logueado, adiós.
if (!isset($_SESSION['logueado']) || !$_SESSION['logueado']) {
    echo json_encode(['status' => 'error', 'message' => 'No autorizado']);
    exit;
}

$conn = obtenerConexion();
$email_usuario = $_SESSION['email']; 
$hoy_mes_dia = date('m-d');

// 2. Buscar contactos que cumplen años HOY (ignorando el año de nacimiento)
$stmt = $conn->prepare("
    SELECT nombre 
    FROM contacto 
    WHERE correo_usuario = ? 
    AND DATE_FORMAT(FCumple, '%m-%d') = ?
");

$stmt->bind_param("ss", $email_usuario, $hoy_mes_dia);
$stmt->execute();
$resultado = $stmt->get_result();

$cumpleaneros = [];

while ($fila = $resultado->fetch_assoc()) {
    $nombre = $fila['nombre'];
    
    mail($email_usuario, "Cumpleaños", "Hoy cumple $nombre");
    
    // Agregamos a la lista para mostrar la alerta visual
    $cumpleaneros[] = $nombre;
}

$stmt->close();
cerrarConexion($conn);

// 3. Devolver la respuesta al Frontend
echo json_encode([
    'status' => 'success',
    'cumpleaneros' => $cumpleaneros
]);
?>