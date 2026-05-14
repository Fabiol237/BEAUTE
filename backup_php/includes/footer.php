    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    
    <!-- Custom JS -->
    <script src="<?= SITE_URL ?>/assets/js/main.js"></script>
</body>
</html>
<?php
if (ob_get_level() > 0) {
    ob_end_flush();
}
?>
