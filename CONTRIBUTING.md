# Contributing to nekuda Shopping Agent Demo

Thank you for your interest in contributing to the nekuda Shopping Agent Demo! This document provides guidelines and instructions for contributing to this project.

## 🤝 Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) to maintain a welcoming and inclusive environment.

## 🚀 Getting Started

1. **Fork the repository** and clone it locally
2. **Set up your development environment** following the README instructions
3. **Create a new branch** for your feature or bug fix:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 💻 Development Process

### Prerequisites
- Node.js v18+
- Python 3.8+
- Git
- Required API keys (see README)

### Setup
```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/nekuda-agent-copilot-demo.git
cd nekuda-agent-copilot-demo

# Install dependencies
cp .env.example .env
# Add your API keys to .env

# Run the setup script
chmod +x run_scripts/start-all.sh
./run_scripts/start-all.sh
```

## 📝 Contribution Guidelines

### What We're Looking For
- 🐛 Bug fixes
- ✨ New features that enhance the SDK demo
- 📚 Documentation improvements
- 🧪 Test coverage improvements
- 🎨 UI/UX enhancements

### Code Style

#### Python (Backend)
- Follow PEP 8 style guide
- Use type hints where possible
- Add docstrings to functions and classes
- Maximum line length: 100 characters

#### TypeScript (Frontend)
- Use TypeScript for all new code
- Follow existing code patterns
- Use functional components with hooks
- Ensure no TypeScript errors

### Commit Messages
- Use clear, descriptive commit messages
- Start with a verb (Add, Fix, Update, etc.)
- Reference issues when applicable: `Fix #123: Description`

Example:
```
Add Gemini model support to browser automation

- Add Gemini configuration to get_llm_model function
- Update documentation with model selection guide
- Add GOOGLE_API_KEY to .env.example
```

## 🔄 Pull Request Process

1. **Update your fork** with the latest main branch:
   ```bash
   git remote add upstream https://github.com/nekuda-ai/nekuda-agent-copilot-demo.git
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Make your changes** in a feature branch

3. **Test your changes** thoroughly:
   - Ensure all services start correctly
   - Test the complete flow from cart to checkout
   - Verify no console errors

4. **Update documentation** if needed:
   - Update README if you've added features
   - Add inline comments for complex logic
   - Update .env.example if adding new variables

5. **Submit a Pull Request**:
   - Use our PR template
   - Provide a clear description of changes
   - Link any related issues
   - Include screenshots for UI changes

### PR Review Process
- All PRs require at least one review from @nekuda-ai/nekuda-eng
- Address review feedback promptly
- Keep PRs focused and reasonably sized

## 🧪 Testing

Before submitting a PR, ensure:
- [ ] The application builds without errors
- [ ] All existing functionality works
- [ ] New features are tested manually
- [ ] No TypeScript errors (`npm run type-check` in frontend)
- [ ] Python code follows PEP 8

## 🐛 Reporting Issues

### Bug Reports
Please include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node/Python versions)
- Error messages and logs

### Feature Requests
Please include:
- Clear use case
- Expected behavior
- Why this would benefit the demo

## 📚 Resources

- [nekuda SDK Documentation](https://docs.nekuda.ai)
- [nekuda Dashboard](https://app.nekuda.ai)
- [CopilotKit Documentation](https://docs.copilotkit.ai)

## ❓ Questions?

- Open a GitHub issue for bugs or features
- Email: founders@nekuda.ai
- Check existing issues before creating new ones

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.