$(document).ready(function() {
    // Initialize Chart.js instances
    let qValuesChart;
    let stateVectorChart;

    // Canvas and image variables for dynamic visualization
    const dqnCanvas = document.getElementById('dqn-canvas');
    const dqnCtx = dqnCanvas.getContext('2d');
    const sageImage = new Image();
    sageImage.src = "{{ url_for('static', filename='images/sage.png') }}";
    let imageLoaded = false;

    sageImage.onload = () => {
        imageLoaded = true;
        // Set canvas dimensions to match image or a desired size
        // For better control, we might set a fixed size or scale
        dqnCanvas.width = sageImage.width; // Or a fixed value like 600
        dqnCanvas.height = sageImage.height; // Or a fixed value like 600
        drawSageImage(); // Draw initially
    };

    // Animation variables
    let currentInputText = "";
    let currentStateVector = [];
    let currentQValues = [];
    let currentDecodedAction = "";
    let selectedActionIndex = -1;
    let particles = [];
    const maxParticles = 50;

    // Particle class for subtle background animation
    class Particle {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.size = Math.random() * 2 + 0.5;
            this.speedX = Math.random() * 0.5 - 0.25;
            this.speedY = Math.random() * 0.5 - 0.25;
            this.color = `rgba(0, 188, 212, ${Math.random() * 0.5 + 0.2})`;
        }

        update() {
            this.x += this.speedX;
            this.y += this.speedY;
            if (this.size > 0.1) this.size -= 0.02;
        }

        draw() {
            dqnCtx.fillStyle = this.color;
            dqnCtx.beginPath();
            dqnCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            dqnCtx.fill();
        }
    }

    function initParticles() {
        for (let i = 0; i < maxParticles; i++) {
            particles.push(new Particle(Math.random() * dqnCanvas.width, Math.random() * dqnCanvas.height));
        }
    }

    function handleParticles() {
        for (let i = 0; i < particles.length; i++) {
            particles[i].update();
            particles[i].draw();
            if (particles[i].size <= 0.1) {
                particles.splice(i, 1);
                particles.push(new Particle(Math.random() * dqnCanvas.width, Math.random() * dqnCanvas.height));
            }
        }
    }

    function drawSageImage() {
        if (imageLoaded) {
            dqnCtx.clearRect(0, 0, dqnCanvas.width, dqnCanvas.height);
            dqnCtx.drawImage(sageImage, 0, 0, dqnCanvas.width, dqnCanvas.height);
        }
    }

    // Function to draw dynamic elements on canvas
    function drawDynamicVisuals() {
        drawSageImage(); // Redraw the base image
        handleParticles(); // Draw and update particles

        // Input Text Visualization: "Thought bubble" effect
        if (currentInputText) {
            dqnCtx.font = "italic 18px 'Segoe UI'";
            dqnCtx.fillStyle = "rgba(255, 255, 255, 0.9)";
            dqnCtx.textAlign = "center";
            dqnCtx.shadowColor = "rgba(0, 188, 212, 0.8)";
            dqnCtx.shadowBlur = 10;
            dqnCtx.fillText(`"${currentInputText.substring(0, 30)}..."`, dqnCanvas.width / 2, 30);
            dqnCtx.shadowBlur = 0;
        }

        // State Vector Visualization: Subtle glow around Sage's head/eyes
        if (currentStateVector.length > 0) {
            const avgState = currentStateVector.reduce((a, b) => a + b, 0) / currentStateVector.length;
            const glowIntensity = Math.min(1, Math.abs(avgState) * 0.05); // Scale intensity, use abs for negative values
            const glowColor = `rgba(0, 188, 212, ${glowIntensity})`;

            dqnCtx.beginPath();
            // Draw a larger glow around the head area
            dqnCtx.arc(dqnCanvas.width * 0.5, dqnCanvas.height * 0.3, 70, 0, Math.PI * 2);
            dqnCtx.fillStyle = glowColor;
            dqnCtx.shadowColor = `rgba(0, 188, 212, ${glowIntensity * 2})`;
            dqnCtx.shadowBlur = 25;
            dqnCtx.fill();
            dqnCtx.shadowBlur = 0;
        }

        // Q-Value Output Visualization: Emanating "decision pathways"
        if (currentQValues.length > 0) {
            const centerX = dqnCanvas.width * 0.5;
            const centerY = dqnCanvas.height * 0.5; // Center of Sage's body
            const baseRadius = 100; // Starting radius for lines
            const maxLineLength = 150;

            currentQValues.forEach((q_val, index) => {
                const angle = (Math.PI * 2 / currentQValues.length) * index - Math.PI / 2; // Start from top
                const lineLength = Math.max(20, Math.min(maxLineLength, q_val * 10)); // Scale Q-value to line length
                const startX = centerX + Math.cos(angle) * baseRadius;
                const startY = centerY + Math.sin(angle) * baseRadius;
                const endX = centerX + Math.cos(angle) * (baseRadius + lineLength);
                const endY = centerY + Math.sin(angle) * (baseRadius + lineLength);

                dqnCtx.beginPath();
                dqnCtx.moveTo(startX, startY);
                dqnCtx.lineTo(endX, endY);
                dqnCtx.lineWidth = (index === selectedActionIndex) ? 4 : 1.5;
                dqnCtx.strokeStyle = (index === selectedActionIndex) ? "rgba(0, 255, 0, 0.9)" : "rgba(0, 188, 212, 0.6)";
                dqnCtx.shadowColor = (index === selectedActionIndex) ? "lime" : "rgba(0, 188, 212, 0.4)";
                dqnCtx.shadowBlur = (index === selectedActionIndex) ? 15 : 5;
                dqnCtx.stroke();
                dqnCtx.shadowBlur = 0;

                // Display decoded action text at the end of the selected line
                if (index === selectedActionIndex && currentDecodedAction) {
                    dqnCtx.font = "bold 16px 'Segoe UI'";
                    dqnCtx.fillStyle = "lime";
                    dqnCtx.textAlign = "center";
                    dqnCtx.fillText(currentDecodedAction, endX, endY + 20);
                }
            });
        }

        requestAnimationFrame(drawDynamicVisuals);
    }

    // Initialize particles and start the animation loop
    initParticles();
    requestAnimationFrame(drawDynamicVisuals);


    function initializeCharts() {
        const qValuesCtx = document.getElementById('q-values-chart').getContext('2d');
        qValuesChart = new Chart(qValuesCtx, {
            type: 'bar',
            data: {
                labels: Array.from({length: 10}, (_, i) => `Action ${i}`), // Assuming 10 actions
                datasets: [{
                    label: 'Q-Values',
                    data: [],
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#e0e0e0'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#e0e0e0'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#e0e0e0'
                        }
                    }
                }
            }
        });

        const stateVectorCtx = document.getElementById('state-vector-chart').getContext('2d');
        stateVectorChart = new Chart(stateVectorCtx, {
            type: 'bar',
            data: {
                labels: Array.from({length: 20}, (_, i) => `Dim ${i}`), // Displaying first 20 dimensions
                datasets: [{
                    label: 'State Vector',
                    data: [],
                    backgroundColor: 'rgba(153, 102, 255, 0.6)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#e0e0e0'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#e0e0e0'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#e0e0e0'
                        }
                    }
                }
            }
        });
    }

    // Call initializeCharts when the document is ready
    initializeCharts();

    function sendMessage() {
        var userText = $("#user-input").val();
        if (userText.trim() === "") return;

        var userHTML = '<div class="chat-message user-message"><p>' + userText + '</p></div>';
        $("#chat-messages").append(userHTML);
        $("#user-input").val("");

        // Scroll to the bottom of the chat
        $("#chat-messages").scrollTop($("#chat-messages")[0].scrollHeight);

        // Send message to Gemini API
        $.get("/get", { msg: userText }).done(function(data) {
            var botHTML = '<div class="chat-message sage-message"><p>' + data + '</p></div>';
            $("#chat-messages").append(botHTML);
            // Scroll to the bottom of the chat after bot response
            $("#chat-messages")[0].scrollTop = $("#chat-messages")[0].scrollHeight;
        });

        // Send message to DQN reasoning endpoint
        $.get("/reason", { text: userText }).done(function(data) {
            if (data.error) {
                console.error("DQN Reasoning Error:", data.error);
                $("#viz-input-text").text("Error: " + data.error);
                $("#viz-decoded-action").text("N/A");
                qValuesChart.data.datasets[0].data = [];
                qValuesChart.update();
                stateVectorChart.data.datasets[0].data = [];
                stateVectorChart.update();
                // Clear dynamic visuals on error
                currentInputText = "";
                currentStateVector = [];
                currentQValues = [];
                currentDecodedAction = "";
                selectedActionIndex = -1;
                return;
            }

            // Update global variables for dynamic visuals
            currentInputText = data.input_text;
            currentStateVector = data.state;
            currentQValues = data.q_values;
            currentDecodedAction = data.decoded_action;
            selectedActionIndex = data.selected_action_index;

            $("#viz-input-text").text(data.input_text);
            $("#viz-decoded-action").text(data.decoded_action);

            // Update Q-Values Chart
            qValuesChart.data.datasets[0].data = data.q_values;
            // Highlight the selected action
            const backgroundColors = Array(data.q_values.length).fill('rgba(75, 192, 192, 0.6)');
            backgroundColors[data.selected_action_index] = 'rgba(255, 99, 132, 0.8)'; // Highlight color
            qValuesChart.data.datasets[0].backgroundColor = backgroundColors;
            qValuesChart.update();

            // Update State Vector Chart (first 20 dimensions)
            stateVectorChart.data.datasets[0].data = data.state.slice(0, 20);
            stateVectorChart.update();
        });
    }

    // Event listeners for sending messages
    $("#user-input").keypress(function(e) {
        if (e.which == 13) { // Enter key
            sendMessage();
        }
    });

    // Assuming there's a send button in index.html
    // If not, you might need to add one or rely solely on the Enter key
    $(".chat-input button").click(function() {
        sendMessage();
    });
});