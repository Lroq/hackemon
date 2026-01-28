// Récupère le profil de l'utilisateur connecté et met à jour l'UI
(async function () {
  function setDefaultProfile() {
    const avatar = document.getElementById('userAvatar');
    const pseudo = document.getElementById('userPseudo');
    if (avatar) avatar.src = '/public/assets/game_px.png';
    if (pseudo) pseudo.textContent = 'Visiteur';
  }

  async function fetchProfile() {
    try {
      const res = await fetch('/profile', { credentials: 'same-origin' });
      if (!res.ok) return null;
      const data = await res.json();
      return data && (data.user || data);
    } catch (err) {
      console.error('Erreur récupération profil:', err);
      return null;
    }
  }

  // Fonction utilitaire pour vérifier si un utilisateur est admin
  function isAdminUser(user) {
    if (!user || !user.username) return false;
    return user.username.startsWith('admin_');
  }

  // Exposer une API globale pour le profil et la vérification admin
  window.UserProfile = {
    async refresh() {
      const user = await fetchProfile();
      if (user) {
        this.set(user);
        return user;
      }
      setDefaultProfile();
      return null;
    },
    set(user) {
      const avatar = document.getElementById('userAvatar');
      const pseudo = document.getElementById('userPseudo');
      if (pseudo) pseudo.textContent = user.username || 'Visiteur';
      if (avatar) {
        // Si user.avatar existe, on l'utilise, sinon image par défaut
        avatar.src = user.avatar || '/public/assets/game_px.png';
      }
    },
    isAdminUser,
    // Ajoute la dernière info utilisateur connue (pour accès rapide)
    _lastUser: null,
    async getCurrentUser() {
      // Récupère et mémorise l'utilisateur courant
      const user = await fetchProfile();
      this._lastUser = user;
      return user;
    },
  };

  // Fonction d'initialisation
  function init() {
    window.UserProfile.refresh();
  }

  // Attendre que le DOM soit prêt puis initialiser
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
