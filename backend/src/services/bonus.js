let bonusTimer = 300; // 5 minutes
let bonusActive = true;

setInterval(() => {
  bonusTimer--;
  if (bonusTimer <= 0) {
    bonusTimer = 300;
    bonusActive = !bonusActive;
  }
}, 1000);

exports.getBonusStatus = () => ({
  timeLeft: bonusTimer,
  active: bonusActive,
  bonusPercent: bonusActive ? 15 : 0,
});