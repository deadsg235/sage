$(document).ready(function() {
    console.log("Document is ready. Initializing chat and visualizer.");

    // Initialize Chart.js instances
    let qValuesChart;
    let stateVectorChart;

    // Canvas and image variables for dynamic visualization
    const dqnCanvas = document.getElementById('dqn-canvas');
    const dqnCtx = dqnCanvas.getContext('2d');

    // Load all Sage images
    const sageImages = {
        'neutral': new Image(),
        'positive': new Image(),
        'confident': new Image(),
        'uncertain': new Image()
    };

    sageImages.neutral.src = "{{ url_for('static', filename='images/sage.png') }}";
    sageImages.positive.src = "{{ url_for('static', filename='images/Futuristic AI girl with neon glow.png') }}";
    sageImages.confident.src = "{{ url_for('static', filename='images/Futuristic AI with vibrant energy.png') }}";
    sageImages.uncertain.src = "{{ url_for('static', filename='images/Shocked AI in neon lights.png') }}";

    let currentSageImage = sageImages.neutral; // Start with neutral image
    let allImagesLoaded = false;
    let loadedCount = 0;
    const totalImages = Object.keys(sageImages).length;

    Object.values(sageImages).forEach(img => {
        img.onload = () => {
            loadedCount++;
            if (loadedCount === totalImages) {
                allImagesLoaded = true;
                // Set canvas dimensions based on the neutral image or a desired size
                // For better control, we might set a fixed size or scale
                dqnCanvas.width = sageImages.neutral.width; // Or a fixed value like 600
                dqnCanvas.height = sageImages.neutral.height; // Or a fixed value like 600
                drawSageImage(); // Draw initially
            }
        };
    });

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
        if (allImagesLoaded) {
            dqnCtx.clearRect(0, 0, dqnCanvas.width, dqnCanvas.height);
            dqnCtx.drawImage(currentSageImage, 0, 0, dqnCanvas.width, dqnCanvas.height);
        }
    }

    // Function to decide which Sage image to display
    function updateSageImageExpression(dqnData) {
        const qValues = dqnData.q_values;
        const selectedAction = dqnData.selected_action_index;

        if (!qValues || qValues.length === 0) {
            currentSageImage = sageImages.neutral;
            return;
        }

        const maxQValue = Math.max(...qValues);
        const minQValue = Math.min(...qValues);
        const qValueRange = maxQValue - minQValue;

        // Thresholds for expression changes (these can be tuned)
        const confidentThreshold = 0.7; // If max Q-value is 70% of the range from min to max
        const uncertainThreshold = 0.3; // If max Q-value is within 30% of the range from min

        if (qValueRange > 0) {
            const normalizedMaxQ = (maxQValue - minQValue) / qValueRange;

            if (normalizedMaxQ > confidentThreshold) {
                currentSageImage = sageImages.confident;
            } else if (normalizedMaxQ < uncertainThreshold) {
                currentSageImage = sageImages.uncertain;
            } else {
                currentSageImage = sageImages.positive; // Default for moderate confidence
            }
        } else {
            currentSageImage = sageImages.neutral; // All Q-values are the same
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
        console.log("sendMessage() called.");
        var userText = $("#user-input").val();
        if (userText.trim() === "") {
            console.log("User input is empty. Not sending message.");
            return;
        }

        var userHTML = '<div class="chat-message user-message"><p>' + userText + '</p></div>';
        $("#chat-messages").append(userHTML);
        $("#user-input").val("");
        console.log("User message appended and input cleared.");

        // Scroll to the bottom of the chat
        $("#chat-messages").scrollTop($("#chat-messages")[0].scrollHeight);
        console.log("Chat scrolled to bottom.");

        // Send message to Gemini API
        $.get("/get", { msg: userText }).done(function(data) {
            console.log("Received response from /get:", data);
            var botHTML = '<div class="chat-message sage-message"><p>' + data + '</p></div>';
            $("#chat-messages").append(botHTML);
            // Scroll to the bottom of the chat after bot response
            $("#chat-messages")[0].scrollTop = $("#chat-messages")[0].scrollHeight;
            console.log("Bot message appended and chat scrolled.");
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.error("Error sending message to /get:", textStatus, errorThrown, jqXHR);
            var errorHTML = '<div class="chat-message sage-message error-message"><p>Error: Could not get response from Sage.</p></div>';
            $("#chat-messages").append(errorHTML);
            $("#chat-messages")[0].scrollTop = $("#chat-messages")[0].scrollHeight;
        });

        // Send message to DQN reasoning endpoint
        $.get("/reason", { text: userText }).done(function(data) {
            console.log("Received response from /reason:", data);
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
                currentSageImage = sageImages.uncertain; // Show uncertain on error
                return;
            }

            // Update global variables for dynamic visuals
            currentInputText = data.input_text;
            currentStateVector = data.state;
            currentQValues = data.q_values;
            currentDecodedAction = data.decoded_action;
            selectedActionIndex = data.selected_action_index;

            // Update Sage image expression based on DQN data
            updateSageImageExpression(data);

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
        }).fail(function(jqXHR, textStatus, errorThrown) {
            console.error("Error sending message to /reason:", textStatus, errorThrown, jqXHR);
            $("#viz-input-text").text("Error: Could not get reasoning.");
            $("#viz-decoded-action").text("N/A");
            currentSageImage = sageImages.uncertain; // Show uncertain on error
        });
    }

    // Event listeners for sending messages
    $("#user-input").keypress(function(e) {
        console.log("Key pressed in user-input. Key code:", e.which);
        if (e.which == 13) { // Enter key
            console.log("Enter key pressed. Calling sendMessage().");
            sendMessage();
        }
    });

    // Assuming there's a send button in index.html
    // If not, you might need to add one or rely solely on the Enter key
    $(".chat-input button").click(function() {
        console.log("Send button clicked. Calling sendMessage().");
        sendMessage();
    });
});