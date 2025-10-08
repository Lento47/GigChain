# GigChain Mobile App

Mobile application for GigChain.io built with React Native and Expo.

## 🚀 Features

- **Wallet Connection**: Web3 wallet integration for authentication
- **Contract Management**: Create, view, and manage contracts on mobile
- **Marketplace**: Browse and purchase contract templates
- **Profile & Reputation**: View reputation NFT and earnings
- **Real-time Notifications**: Push notifications for contract updates
- **QR Code Scanning**: Quick contract scanning and sharing
- **Offline Support**: Cache data for offline access

## 📋 Prerequisites

- Node.js 16+ and npm/yarn
- Expo CLI: `npm install -g expo-cli`
- iOS Simulator (Mac) or Android Emulator
- Physical device for testing (recommended)

## 🛠️ Installation

```bash
cd mobile-app

# Install dependencies
npm install

# Start Expo development server
npm start

# Run on specific platform
npm run ios      # iOS Simulator
npm run android  # Android Emulator
npm run web      # Web browser
```

## 📱 Running on Physical Device

1. Install **Expo Go** app from App Store / Play Store
2. Scan the QR code from the Expo Dev Tools
3. App will load on your device

## 🏗️ Project Structure

```
mobile-app/
├── src/
│   ├── screens/          # Screen components
│   ├── components/       # Reusable UI components
│   ├── navigation/       # Navigation configuration
│   ├── contexts/         # React contexts (Wallet, Theme, etc.)
│   ├── services/         # API services
│   ├── utils/            # Utility functions
│   └── types/            # TypeScript types
├── assets/               # Images, fonts, etc.
├── App.tsx               # App entry point
├── app.json              # Expo configuration
└── package.json          # Dependencies
```

## 🔧 Configuration

Update the API URL in `src/config/api.ts`:

```typescript
export const API_URL = process.env.API_URL || 'http://localhost:5000';
```

For production, update to your deployed backend URL.

## 📦 Key Dependencies

- **expo**: Development framework
- **react-navigation**: Navigation library
- **@thirdweb-dev/react-native**: Web3 wallet integration
- **axios**: HTTP client
- **expo-secure-store**: Secure storage for sensitive data
- **expo-camera**: QR code scanning

## 🎨 Theming

The app supports light/dark themes. Theme configuration is in `src/contexts/ThemeContext.tsx`.

## 🔐 Security

- Private keys never stored on device
- Secure storage for session tokens
- Biometric authentication support (TODO)
- PIN code protection (TODO)

## 🧪 Testing

```bash
# Run tests
npm test

# Run with coverage
npm test -- --coverage
```

## 📝 Development Notes

- Backend must be running on `localhost:5000` for development
- Use Expo tunnel for testing on physical device
- Hot reloading enabled by default

## 🚀 Building for Production

### iOS

```bash
expo build:ios
```

### Android

```bash
expo build:android
```

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📞 Support

For issues and questions, please open an issue on GitHub.
