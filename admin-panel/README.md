# GigChain Admin Panel

Complete administration dashboard for managing the GigChain.io platform.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start Backend

Make sure the GigChain backend is running on port 5000:

```bash
cd /workspace
python main.py
```

### 3. Start Admin Panel

```bash
npm run dev
```

Access at: `http://localhost:3001`

## 🔐 Default Login

- **Username:** `admin`
- **Password:** `admin123`

⚠️ **IMPORTANT:** Change this password immediately after first login!

## 📋 Features

### Dashboard
- Platform statistics overview
- Real-time metrics
- System alerts
- Quick actions menu

### User Management
- View all platform users
- Search and filter users
- Suspend/ban/activate users
- View detailed user profiles
- Trust score visualization

### Contracts
- View all contracts
- Filter by status
- Contract details

### Disputes
- Monitor all disputes
- View evidence
- Track resolution progress

### Marketplace
- Template moderation
- Listing management
- Sales statistics

### Analytics
- Platform-wide analytics
- Custom reports
- Trend analysis

### Activity Log
- Complete audit trail
- Admin action history
- Security monitoring

### Settings
- Platform configuration
- Admin account management
- System settings

## 🛠️ Tech Stack

- **React 18.3** - UI framework
- **React Router 6** - Routing
- **Zustand** - State management
- **Axios** - HTTP client
- **Lucide React** - Icons
- **Vite** - Build tool

## 📁 Project Structure

```
admin-panel/
├── src/
│   ├── components/
│   │   └── Layout/
│   │       ├── AdminLayout.jsx
│   │       └── AdminLayout.css
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── UsersPage.jsx
│   │   ├── ContractsPage.jsx
│   │   ├── DisputesPage.jsx
│   │   ├── MarketplacePage.jsx
│   │   ├── AnalyticsPage.jsx
│   │   ├── ActivityLogPage.jsx
│   │   └── SettingsPage.jsx
│   ├── store/
│   │   └── adminStore.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── package.json
├── vite.config.js
└── index.html
```

## 🔧 Development

### Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test
```

### API Endpoints Used

All API calls go through the backend at `http://localhost:5000`:

- `/api/admin/login` - Authentication
- `/api/admin/verify` - Session verification
- `/api/admin/dashboard/stats` - Platform statistics
- `/api/admin/users` - User management
- `/api/admin/users/status` - Update user status
- `/api/admin/contracts/all` - Contract list
- `/api/admin/disputes/all` - Dispute list
- `/api/admin/marketplace/templates` - Template list
- `/api/admin/activity/log` - Activity log
- `/api/admin/alerts` - System alerts
- `/api/admin/analytics/overview` - Analytics data

## 🎨 Styling

The admin panel uses custom CSS with CSS variables for theming:

```css
:root {
  --primary: #6366f1;
  --success: #10b981;
  --warning: #f59e0b;
  --danger: #ef4444;
  --dark: #1a1a1a;
  --light: #f5f5f5;
}
```

## 🔒 Security

- Session-based authentication
- Token stored in localStorage
- Protected routes
- Role-based access control
- Activity logging
- Auto-logout on session expiration

## 📊 Admin Roles

1. **Super Admin** - Full system access
2. **Admin** - Platform management
3. **Moderator** - Content moderation
4. **Support** - User support

## 🐛 Troubleshooting

### Backend Not Connecting

Make sure backend is running:
```bash
curl http://localhost:5000/api/admin/health
```

### Authentication Fails

Check backend logs for admin user creation:
```bash
tail -f backend.log
```

### CORS Issues

Backend CORS is configured for `localhost:3001`. If using different port, update backend CORS settings.

## 📝 TODO

- [ ] Add complete CSS files
- [ ] Implement charts for analytics
- [ ] Add export functionality
- [ ] Implement bulk user operations
- [ ] Add admin notification system
- [ ] Implement advanced filtering
- [ ] Add data visualization
- [ ] Create admin mobile app

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit PR

## 📞 Support

For issues or questions, contact the development team.
