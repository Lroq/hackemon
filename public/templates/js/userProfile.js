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

  // Exposer une API minimale globale pour mettre à jour le profil dans l'UI
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
