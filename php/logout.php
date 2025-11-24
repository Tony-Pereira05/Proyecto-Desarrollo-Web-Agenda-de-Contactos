<?php
/**
 * ============================================================================
 * CERRAR SESIÓN
 * ============================================================================
 */

session_start();

// Limpiar todas las variables de sesión
$_SESSION = array();

// Destruir cookie de sesión
if (isset($_COOKIE[session_name()])) {
    setcookie(session_name(), '', time()-3600, '/');
}

// Destruir sesión
session_destroy();

// Redirigir al login
header('Location: ../login.html');
exit;
