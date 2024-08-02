import React, { useEffect, useRef, useState } from 'react';
import './App.css';

const App = () => {
    const containerRef = useRef(null);
    const [circles, setCircles] = useState([]);
    const emoji = [
        '😍', '🥰', '😘', '🥺', '🥵', '👽', '😻', '😽', '💋',
        '🧟‍♀️', '💅', '🐊', '🦧', '🍍', '❤️', '🧡', '💛', '💚',
        '🖤', '💜', '💙', '🤍', '🤎', '💞', '🌸',
        '🌹', '🌷', '🌺'
    ];

    useEffect(() => {
        for (let i = 0; i < 10; i++) {
            addCircle(i * 150, [10, 300], getRandomEmoji());
            addCircle(i * 150, [10, -300], getRandomEmoji());
            addCircle(i * 150, [10 - 200, -300], getRandomEmoji());
            addCircle(i * 150, [10 + 200, 300], getRandomEmoji());
            addCircle(i * 150, [10 - 400, -300], getRandomEmoji());
            addCircle(i * 150, [10 + 400, 300], getRandomEmoji());
            addCircle(i * 150, [10 - 600, -300], getRandomEmoji());
            addCircle(i * 150, [10 + 600, 300], getRandomEmoji());
        }

        const animate = () => {
            setCircles(prevCircles =>
                prevCircles.map(circle => updateCircle(circle))
            );
            requestAnimationFrame(animate);
        };

        animate();
    }, []);

    const getRandomEmoji = () => {
        return emoji[Math.floor(Math.random() * emoji.length)];
    };

    const addCircle = (delay, range, color) => {
        setTimeout(() => {
            const newCircle = createCircle(range[0] + Math.random() * range[1], 80 + Math.random() * 4, color, {
                x: -0.15 + Math.random() * 0.3,
                y: (1 + Math.random()) / 2
            }, range);
            setCircles(prevCircles => [...prevCircles, newCircle]);
        }, delay);
    };

    const createCircle = (x, y, color, velocity, range) => {
        const element = document.createElement('span');
        element.style.opacity = 0;
        element.style.position = 'absolute';
        element.style.fontSize = '26px';
        element.style.color = `hsl(${Math.random() * 360 | 0}, 80%, 50%)`;
        element.innerHTML = color;
        containerRef.current.appendChild(element);
        return { x, y, color, velocity, range, element };
    };

    const updateCircle = (circle) => {
        if (circle.y > window.innerHeight + 200) {
            circle.y = 80 + Math.random() * 4;
            circle.x = circle.range[0] + Math.random() * circle.range[1];
        }
        circle.y += circle.velocity.y;
        circle.x += circle.velocity.x;
        circle.element.style.opacity = 1;
        circle.element.style.transform = `translate3d(${circle.x}px, ${circle.y}px, 0px)`;
        return circle;
    };

    return (
        <div className="body">
            <link href="https://fonts.googleapis.com/css?family=Nunito:600,700" rel="stylesheet" />
            <div id="all">
                <div id="container">
                    <div id="animate" ref={containerRef}></div>
                </div>
            </div>
            <div id="text">
                <h2><span className="text-purple">You</span> are a <span className="text-blue">star</span> in a night sky, <span className="text-yellow">shining</span> with an ethereal light that outshines all the <span className="text-dark">darkness</span> around me...</h2>
            </div>
            <div id="footer">
                <p>For the girl with torn tights only</p>
            </div>
        </div>
    );
};

export default App;
