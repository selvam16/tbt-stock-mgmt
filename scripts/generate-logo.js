const canvas = require("canvas");
const fs = require("fs");
const path = require("path");

// Optimized size for splash screens and app icons
const size = 1200;
const canvas_obj = canvas.createCanvas(size, size);
const ctx = canvas_obj.getContext("2d");

// Premium gradient background
const gradient = ctx.createLinearGradient(0, 0, size, size);
gradient.addColorStop(0, "#001f47");
gradient.addColorStop(0.5, "#0066cc");
gradient.addColorStop(1, "#00d4ff");
ctx.fillStyle = gradient;
ctx.fillRect(0, 0, size, size);

// Add subtle animated-looking radial glow
const radialGradient = ctx.createRadialGradient(
  size / 2,
  size / 2,
  0,
  size / 2,
  size / 2,
  size,
);
radialGradient.addColorStop(0, "rgba(255, 255, 255, 0.1)");
radialGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
ctx.fillStyle = radialGradient;
ctx.fillRect(0, 0, size, size);

// Draw decorative concentric circles with gradient effect
ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
ctx.lineWidth = 3;
for (let i = 3; i > 0; i--) {
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, (size / 2 - 40) * (i / 3), 0, Math.PI * 2);
  ctx.stroke();
}

// Draw a sophisticated warehouse/storage icon
const iconCenterX = size / 2;
const iconCenterY = size / 2 - 140;

// Warehouse building shape
ctx.fillStyle = "#ffffff";
ctx.strokeStyle = "#ffffff";
ctx.lineWidth = 8;

// Main warehouse box
ctx.fillRect(iconCenterX - 100, iconCenterY - 60, 200, 120);

// Warehouse roof (triangle)
ctx.beginPath();
ctx.moveTo(iconCenterX - 100, iconCenterY - 60);
ctx.lineTo(iconCenterX, iconCenterY - 120);
ctx.lineTo(iconCenterX + 100, iconCenterY - 60);
ctx.fill();

// Warehouse door
ctx.fillStyle = "#0066cc";
ctx.fillRect(iconCenterX - 40, iconCenterY + 20, 80, 70);

// Wide gate lines
ctx.strokeStyle = "#ffffff";
ctx.lineWidth = 4;
ctx.beginPath();
ctx.moveTo(iconCenterX - 30, iconCenterY + 30);
ctx.lineTo(iconCenterX + 30, iconCenterY + 30);
ctx.stroke();
ctx.beginPath();
ctx.moveTo(iconCenterX - 30, iconCenterY + 55);
ctx.lineTo(iconCenterX + 30, iconCenterY + 55);
ctx.stroke();

// Draw TBT text with premium styling
ctx.font = "bold 320px 'Arial Black'";
ctx.fillStyle = "#ffffff";
ctx.textAlign = "center";
ctx.textBaseline = "middle";
ctx.shadowColor = "rgba(0, 102, 204, 0.6)";
ctx.shadowBlur = 30;
ctx.shadowOffsetX = 0;
ctx.shadowOffsetY = 0;
ctx.fillText("TBT", size / 2, size / 2 + 80);

// Add a glowing underline effect
ctx.strokeStyle = "rgba(0, 212, 255, 0.8)";
ctx.lineWidth = 8;
ctx.lineCap = "round";
ctx.beginPath();
ctx.moveTo(size / 2 - 200, size / 2 + 160);
ctx.lineTo(size / 2 + 200, size / 2 + 160);
ctx.stroke();

// Save the logo
const outputPath = path.join(__dirname, "../assets/images/invoice_tbt.png");
const buffer = canvas_obj.toBuffer("image/png");
fs.writeFileSync(outputPath, buffer);

console.log(`Logo created successfully at: ${outputPath}`);
