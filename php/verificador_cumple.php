<?php
// code/php/verificar_cumples_al_instante.php

session_start();
require_once 'conexion.php';
header('Content-Type: application/json');

// Si no está logueado, no hacemos nada
if (!isset($_SESSION['logueado']) || !$_SESSION['logueado']) {
    echo json_encode(['status' => 'error', 'message' => 'No autorizado']);
    exit;
}

$conn = obtenerConexion();
$email_usuario = $_SESSION['email']; // Solo buscamos contactos de ESTE usuario
$hoy_mes_dia = date('m-d');

// Buscamos contactos que cumplan años hoy Y que sean del usuario logueado
$stmt = $conn->prepare("
    SELECT nombre, FCumple 
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
    
    // --- AQUÍ ENVIAMOS EL CORREO (Simulado o Real) ---
    // Para la tarea, basta con que funcione la lógica, el mail real puede tardar.
    // Si tienes servidor de correo, descomenta la función mail().
    
    $asunto = "Recordatorio: Cumpleaños de $nombre";
    $mensaje = "Tu contacto $nombre cumple años hoy.";
    $headers = "From: no-reply@tuagenda.com";
    
    // mail($email_usuario, $asunto, $mensaje, $headers); // Descomentar para enviar real
    
    // Guardamos el nombre para mostrarlo en pantalla
    $cumpleaneros[] = $nombre;
}

$stmt->close();
cerrarConexion($conn);

// Devolvemos la lista de gente que cumple años hoy al JavaScript
echo json_encode([
    'status' => 'success',
    'cumpleaneros' => $cumpleaneros
]);
?>