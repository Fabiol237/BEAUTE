<nav class="navbar navbar-expand-lg navbar-dark bg-primary">
    <div class="container-fluid">
        <a class="navbar-brand fw-bold" href="<?= SITE_URL ?>/dashboard.php">
            <img src="/projet-municipal/assets/images/logo.png" alt="Logo"
                 style="height:35px;width:35px;object-fit:contain;margin-right:10px;background:white;padding:5px;border-radius:8px;">
            <?= SITE_NAME ?>
        </a>

        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navbarNav">
            <!-- Navigation principale — tous les éléments dans UN SEUL <ul> -->
            <!-- BUG CORRIGÉ : <li> était placé EN DEHORS de tout <ul>, HTML invalide.
                 Carte et Utilisateurs étaient dans des <ul> séparés ou orphelins.
                 Tout est maintenant dans une seule liste cohérente. -->
            <ul class="navbar-nav me-auto">
                <li class="nav-item">
                    <a class="nav-link <?= basename($_SERVER['PHP_SELF']) == 'dashboard.php' ? 'active' : '' ?>"
                       href="<?= SITE_URL ?>/dashboard.php">
                        <i class="bi bi-speedometer2"></i> Dashboard
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link <?= strpos($_SERVER['PHP_SELF'], '/projets/') !== false ? 'active' : '' ?>"
                       href="<?= SITE_URL ?>/projets/liste.php">
                        <i class="bi bi-folder"></i> Projets
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link <?= strpos($_SERVER['PHP_SELF'], '/budget/') !== false ? 'active' : '' ?>"
                       href="<?= SITE_URL ?>/budget/liste.php">
                        <i class="bi bi-cash-stack"></i> Budget
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link <?= basename($_SERVER['PHP_SELF']) == 'carte.php' ? 'active' : '' ?>"
                       href="<?= SITE_URL ?>/carte.php">
                        <i class="bi bi-geo-alt-fill"></i> Carte
                    </a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="<?= SITE_URL ?>/portail-citoyen/index.php" target="_blank">
                        <i class="bi bi-globe"></i> Portail Citoyen
                    </a>
                </li>
                <!-- Lien Utilisateurs visible uniquement pour les admins -->
                <?php if (($_SESSION['utilisateur_role'] ?? '') === 'admin'): ?>
                <li class="nav-item">
                    <a class="nav-link <?= strpos($_SERVER['PHP_SELF'], '/utilisateurs/') !== false ? 'active' : '' ?>"
                       href="<?= SITE_URL ?>/utilisateurs/liste.php">
                        <i class="bi bi-people-fill"></i> Utilisateurs
                    </a>
                </li>
                <?php endif; ?>
            </ul>

            <!-- Menu utilisateur -->
            <ul class="navbar-nav">
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" id="userDropdown"
                       role="button" data-bs-toggle="dropdown">
                        <i class="bi bi-person-circle"></i>
                        <?= e($_SESSION['utilisateur_prenom'] ?? 'Utilisateur') ?>
                        <span class="badge bg-light text-primary ms-1" style="font-size:0.7rem;">
                            <?= e($_SESSION['utilisateur_role'] ?? '') ?>
                        </span>
                    </a>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li>
                            <span class="dropdown-item-text text-muted small">
                                <?= e(($_SESSION['utilisateur_prenom'] ?? '') . ' ' . ($_SESSION['utilisateur_nom'] ?? '')) ?>
                                <br>
                                <small><?= e($_SESSION['utilisateur_email'] ?? '') ?></small>
                            </span>
                        </li>
                        <li><hr class="dropdown-divider"></li>
                        <li>
                            <a class="dropdown-item text-danger" href="<?= SITE_URL ?>/logout.php">
                                <i class="bi bi-box-arrow-right me-2"></i>Déconnexion
                            </a>
                        </li>
                    </ul>
                </li>
            </ul>
        </div>
    </div>
</nav>
