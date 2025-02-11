(function ($) {
    $.fn.npsGauge = function (options) {
        if ($(this).length > 1) {
            return $(this).each(function (i, e) {
                return $(e).npsGauge(options);
            })
        }

        const $el = $(this);
        // Standard-Parameter
        const defaults = {
            minValue: -100,
            maxValue: 100,
            value: 0,
            width: 200, // Standardbreite
            height: 200 // Standardhöhe
        };


        // Alle Einstellungen zusammenführen: Defaults, data-Attribute, Optionen
        const settings = $.extend({}, defaults, $el.data(), options);
console.log(settings);

        const value = settings.value || 0;


        function createGaugeChart($element, nps) {
            let canvasElement;
            if ($element.is('canvas')) {
                canvasElement = $element.get(0);
                canvasElement.width = settings.width + 'px';
                canvasElement.height = settings.height + 'px';
            } else {
                console.log(settings.width, settings.height);
                $element.css({
                    height: settings.height + 'px',
                    width: settings.width + 'px'
                });
                const canvas = $('<canvas>', {
                    width: settings.width,
                    height: settings.height
                }).css({
                    width: settings.width + 'px',
                    height: settings.height + 'px'
                }).appendTo($element);

                canvasElement = canvas.get(0);
            }
            const ctx = canvasElement.getContext('2d');




            // Begrenze den NPS-Wert auf den Bereich -100 bis 100
            const clampedNps = Math.max(-100, Math.min(100, nps));

            let progressColor;
            if (clampedNps <= 0) {
                progressColor = '#ff4c4c'; // Rot für negative Werte
            } else if (clampedNps <= 70) {
                progressColor = '#ffd700'; // Gelb bis zu einem moderaten NPS (typisch ~70)
            } else {
                progressColor = '#4caf50'; // Grün erst ab einem wirklich hohen NPS
            }

            // Chart-Daten
            const gaugeData = {
                datasets: [
                    {
                        data: [0, 100], // Fortschritt startet bei 0
                        backgroundColor: ['#e0e0e0', '#e0e0e0'], // Hintergrundfarbe
                        borderWidth: 0 // Keine Ränder
                    }
                ]
            };

            // Chart-Optionen
            const gaugeOptions = {
                rotation: -90, // Halber Kreis startet unten
                circumference: 180, // Nur ein Halbkreis
                cutout: '70%', // Platz für Text und Zeiger
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    tooltip: { enabled: false } // Tooltips deaktivieren
                }
            };

            // Animation von -100 bis "value"
            let animationProgress = settings.minValue; // Start bei -100
            const duration = 1500; // Animation dauert 1,5 Sekunden
            const startTime = performance.now(); // Startzeit der Animation

            function animateNeedle(frameTime) {
                // Fortschritt berechnen
                const elapsed = frameTime - startTime;
                const progress = Math.min(elapsed / duration, 1); // Fortschritt max bis 1
                animationProgress = settings.minValue + (clampedNps + settings.maxValue) * progress;

                // Dynamische Farbzuordnung basierend auf aktueller Position
                let progressColor;
                if (animationProgress <= 0) {
                    progressColor = '#ff4c4c'; // Rot für negative Werte
                } else if (animationProgress <= 80) {
                    progressColor = '#ffd700'; // Gelb für neutrale Werte (bis 80)
                } else {
                    progressColor = '#4caf50'; // Grün für hohe Werte (über 80)
                }


                // Prozentualer Fortschritt aktualisieren (0 bis 100)
                const progressPercent = ((animationProgress + 100) / 200) * 100;
                gaugeData.datasets[0].data = [progressPercent, 100 - progressPercent];
                gaugeData.datasets[0].backgroundColor = [progressColor, '#e0e0e0']; // Fortschrittsfarbe ändern

                // Chart aktualisieren
                if (canvasElement.chartInstance) {
                    canvasElement.chartInstance.update('none'); // Kein Standard-Update, da animiert
                }

                // Animation fortsetzen, bis abgeschlossen
                if (progress < 1) {
                    requestAnimationFrame(animateNeedle);
                }
            }

            // Plugin für Zeiger und Text in der Mitte
            const customPlugin = {
                id: 'customPlugin',
                afterDraw(chart) {
                    const { width } = chart;
                    const { height } = chart;
                    const { ctx } = chart;

                    // Berechne den Winkel basierend auf dem animierten Fortschritt
                    const animatedPercent = ((animationProgress + 100) / 200) * Math.PI; // 0 bis 180 Grad (Math.PI)

                    // Mittelpunkt des Halbkreises
                    const centerX = width / 2;
                    const centerY = height / 1.3; // Mittelpunkt nach unten verschoben

                    // Länge des Zeigers
                    const radius = (width / 2) * 0.8;

                    // Berechne die Spitze des Zeigers
                    const needleTipX = centerX + radius * Math.cos(animatedPercent - Math.PI);
                    const needleTipY = centerY + radius * Math.sin(animatedPercent - Math.PI);

                    // Berechne die "Basis"-Punkte des Zeigers
                    const baseLeftX = centerX + (radius - 30) * Math.cos(animatedPercent - Math.PI - 0.1);
                    const baseLeftY = centerY + (radius - 30) * Math.sin(animatedPercent - Math.PI - 0.1);

                    const baseRightX = centerX + (radius - 30) * Math.cos(animatedPercent - Math.PI + 0.1);
                    const baseRightY = centerY + (radius - 30) * Math.sin(animatedPercent - Math.PI + 0.1);

                    // Zeichne den Zeiger als Dreieck
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(needleTipX, needleTipY); // Spitze des Dreiecks
                    ctx.lineTo(baseLeftX, baseLeftY); // Linkes Ende der Basis
                    ctx.lineTo(baseRightX, baseRightY); // Rechtes Ende der Basis
                    ctx.closePath();
                    ctx.fillStyle = 'rgba(10, 10, 10, 1)'; // Zeigerfarbe
                    ctx.fill();
                    ctx.restore();

                    // Zeichne den NPS-Text in der Mitte des Kreises
                    const text = `${Math.round(animationProgress)}`;
                    ctx.save();
                    ctx.font = '20px Arial';
                    // ctx.fontWeight = 'thin';
                    ctx.fillStyle = progressColor;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(text, centerX, height / 1.38); // Text direkt in der Mitte
                    ctx.restore();

                    drawScale(ctx, centerX, centerY, radius, 40, 0);

                }
            };

            // Vorhandenen Chart zerstören, wenn nötig
            if (canvasElement.chartInstance) {
                canvasElement.chartInstance.destroy();
            }

            // Neues Chart-Objekt erstellen
            canvasElement.chartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: gaugeData,
                options: gaugeOptions,
                plugins: [customPlugin], // Das erweiterte Plugin hinzufügen
            });

            // Starte die Nadel-Animation
            requestAnimationFrame(animateNeedle);
        }

        function drawScale(ctx, centerX, centerY, radius, cutoutPercent, scaleOffset = 2) {
            const cutoutRadius = radius * (cutoutPercent / 100); // Effektiver innerer Radius des Donuts

            // Skalenradius berechnen basierend auf scaleOffset
            const innerRadius = cutoutRadius + scaleOffset; // Skalenlinie beginnt hier (innerhalb des Donuts)
            const outerRadius = radius - scaleOffset; // Längere Skalenlinie endet hier
            const shortOuterRadius = outerRadius - 10; // Kürzere Skalenmarkierungen

            // Dynamische Anpassung des labelRadius basierend auf der Canvas-Größe
            const maxLabelRadius = Math.min(centerX, centerY) - 10; // Verhindert, dass Labels außerhalb der Canvas liegen
            const labelRadius = Math.min(radius + 30, maxLabelRadius); // Standardmäßig +30, aber begrenzt, wenn nötig

            const startAngle = Math.PI;       // Startwinkel bei -100 (links unten)
            const endAngle = 2 * Math.PI;    // Endwinkel bei 100 (rechts unten)
            const majorStep = 25;           // Schritte der großen Skalen-Striche (z. B. alle 25)
            const minorStep = 5;            // Schritte der kleinen Skalen-Striche (z. B. alle 5)

            ctx.save(); // Speichere aktuellen Canvas-Zustand

            ctx.font = '12px Arial'; // Schriftart der Labels
            ctx.textAlign = 'center'; // Text horizontal zentrieren
            ctx.textBaseline = 'middle'; // Text vertikal mittig ausrichten

            // Schleife für kleine Markierungen (Zwischenwerte)
            for (let i = settings.minValue; i <= settings.maxValue; i += minorStep) {
                const percent = (i + 100) / 200; // Wertebereich: 0 (bei -100) bis 1 (bei 100)
                const angle = startAngle + percent * (endAngle - startAngle);

                // Kürzere Striche für kleine Markierung
                const xInner = centerX + innerRadius * Math.cos(angle);
                const yInner = centerY + innerRadius * Math.sin(angle);

                const xOuter = centerX + shortOuterRadius * Math.cos(angle);
                const yOuter = centerY + shortOuterRadius * Math.sin(angle);

                ctx.beginPath();
                ctx.moveTo(xInner, yInner);
                ctx.lineTo(xOuter, yOuter);
                ctx.strokeStyle = '#666'; // Grau für feine Linien
                ctx.lineWidth = 1; // Dünnere Linien für kleine Striche
                ctx.stroke();
            }

            // Schleife für große Markierungen (Hauptwerte)
            for (let i = settings.minValue; i <= settings.maxValue; i += majorStep) {
                const percent = (i + 100) / 200; // Wertebereich: 0 (bei -100) bis 1 (bei 100)
                const angle = startAngle + percent * (endAngle - startAngle);

                // Längere Striche für Hauptmarkierung
                const xInner = centerX + innerRadius * Math.cos(angle);
                const yInner = centerY + innerRadius * Math.sin(angle);

                const xOuter = centerX + outerRadius * Math.cos(angle);
                const yOuter = centerY + outerRadius * Math.sin(angle);

                ctx.beginPath();
                ctx.moveTo(xInner, yInner);
                ctx.lineTo(xOuter, yOuter);
                ctx.strokeStyle = '#666'; // Schwarz für große Linien
                ctx.lineWidth = 1; // Dickere Linien für Hauptstriche
                ctx.stroke();

                // Labels für die Hauptmarkierungen
                const xLabel = centerX + labelRadius * Math.cos(angle);
                const yLabel = centerY + labelRadius * Math.sin(angle);

                ctx.fillStyle = '#000'; // Schwarz für Labels
                ctx.fillText(i.toString(), xLabel, yLabel); // Beschriftungswert (i)
            }

            ctx.restore(); // Canvas-Zustand wiederherstellen
        }

        createGaugeChart($el,value);

        return $el;
    }
}(jQuery))
