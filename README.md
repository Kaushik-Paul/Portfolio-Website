# Kaushik Paul's Portfolio Website

[![Live Website](https://img.shields.io/badge/Live_Website-6c63ff?logo=rocket&logoColor=white&labelColor=5a52d3)](https://www.kaushikpaul.co.in/)
[![Deployment](https://img.shields.io/badge/Deployed%20on-Cloudflare%20Pages-FF7139?logo=cloudflare)](https://pages.cloudflare.com/)

A modern, responsive portfolio website showcasing my skills, experience, and projects as an SDE 2 and backend-focused AI engineer. The website features a clean, interactive design with smooth animations, a custom 404 page, and an integrated AI chatbot for recruiter-friendly Q&A.

## 🚀 Live Website

Check out the live website: [https://www.kaushikpaul.co.in/](https://www.kaushikpaul.co.in/)

## ✨ Features

- **Responsive Design**: Fully responsive layout that works on all devices
- **Modern UI/UX**: Clean, professional design with smooth animations
- **Interactive Elements**: Engaging user interactions and hover effects
- **AI Chatbot**: Bottom-right assistant widget for asking about experience, projects, skills, resume, and contact details
- **Responsive Chat Experience**: Desktop floating chat panel and mobile draggable bottom sheet with light/dark theme support
- **Markdown Chat Responses**: Assistant responses support markdown, tables, lists, links, and scrollable code blocks
- **Full-Screen Chat Link**: Quick access to the dedicated chat app at [https://www.ai-chat.pp.ua/](https://www.ai-chat.pp.ua/)
- **Custom 404 Page**: User-friendly error page with a fun rocket animation
- **Performance Optimized**: Fast loading times and efficient asset delivery
- **SEO Friendly**: Proper meta tags and semantic HTML

## 🛠️ Technologies Used

### Frontend
- **HTML5**: Semantic markup for better accessibility and SEO
- **CSS3**: Custom animations, transitions, and responsive design
- **JavaScript**: Interactive elements and dynamic content
- **Font Awesome**: For beautiful icons
- **Google Fonts (Poppins)**: Clean, modern typography
- **Marked + DOMPurify**: Safe markdown rendering for chatbot responses

### Chatbot
- **API**: Uses `https://api.ai-chat.pp.ua` in production
- **Local API**: Uses `http://127.0.0.1:8000` when the site is served from `localhost` or `127.0.0.1`
- **Widget Files**: Chatbot HTML, CSS, and JavaScript live in `main/chatbot/`
- **Production API Keys**: Reads Cloudflare Pages secrets through `main/functions/api/chatbot/config.js`
- **Warm-up Health Check**: Calls `/health` on the first chat open before enabling message sending
- **Session Handling**: Keeps chat history and session ID in page memory only; reloading the page starts a fresh session

### Deployment
- **Cloudflare Pages**: Fast, global CDN hosting
- **Custom Domain**: Professional domain with SSL
- **Continuous Deployment**: Automatic deployments on push to main branch


## 🚀 Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- Git (for development)
- A Cloudflare account (for deployment)

### Local Development
1. Clone the repository:
   ```bash
   git clone https://github.com/kaushik-paul/portfolio-website.git
   cd portfolio-website
   ```

2. Serve the `main/` directory over HTTP. This is recommended for local development because the chatbot loads its markup from `main/chatbot/chat-widget.html`:
   ```bash
   cd main
   python3 -m http.server 8080
   ```

   Then open [http://127.0.0.1:8080](http://127.0.0.1:8080).

3. Optional: run the local chatbot backend from the AI twin project:
   ```bash
   cd ../ai-twin/backend
   CORS_ORIGINS=http://127.0.0.1:8080,http://localhost:8080 uvicorn main.server:app --reload --port 8000
   ```

### Deployment
The website is automatically deployed to Cloudflare Pages on every push to the `main` branch.

Set these Cloudflare Pages production secrets for the chatbot:

```bash
AI_CHAT_HEALTH_API_KEY=your-health-endpoint-api-key
AI_CHAT_CHAT_API_KEY=your-chat-endpoint-api-key
```

## 🎨 Customization

### Changing Colors
Update the CSS variables in `main/style.css` to change the color scheme:
```css
:root {
    --first-color: #6c63ff;
    --first-color-alt: #5a52d3;
    --title-color: #2d2e32;
    --text-color: #555;
    --body-color: #f9f9f9;
    --container-color: #fff;
}
```

### Adding New Sections
1. Add a new section in `index.html` with a unique ID
2. Style it in `style.css`
3. Add any necessary JavaScript functionality in `app.js`

### Chatbot Files
The chatbot is intentionally isolated from the main page files:
- `main/chatbot/chat-widget.html`: Widget markup
- `main/chatbot/chat-widget.css`: Chat-specific layout, themes, markdown, and responsive styles
- `main/chatbot/chat-widget.js`: Widget loading, API calls, session handling, warm-up, markdown rendering, and mobile resizing

## 🤝 Contributing

Contributions are welcome! If you find any issues or want to suggest improvements, please open an issue or submit a pull request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


---

Made with ❤️ by Kaushik Paul
