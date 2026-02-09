# MySQL Setup Guide for Status Focus

## Windows Setup

### Option 1: Using MySQL Installer (Easiest)

1. **Download MySQL Community Server**
   - Visit: https://dev.mysql.com/downloads/mysql/
   - Download MySQL 8.0 or 5.7 for Windows

2. **Run Installer**
   - Execute `mysql-installer-web-community-x.x.x.msi`
   - Choose "Developer Default"
   - Click "Next" through setup wizard

3. **MySQL Server Configuration**
   - **Port**: Keep default `3306`
   - **Root Password**: Set to `123456789` (or your choice)
   - **MySQL Service Name**: `MySQL80`
   - Click "Execute" to configure

4. **Verify Installation**
   ```bash
   # Open Command Prompt
   mysql -u root -p
   # Enter password: 123456789
   # If you see mysql> prompt, you're good!
   exit
   ```

### Option 2: Using MySQL Workbench

1. **Download MySQL Workbench**
   - https://dev.mysql.com/downloads/workbench/

2. **Connect to local MySQL**
   - Hostname: `localhost`
   - Port: `3306`
   - Username: `root`
   - Password: `123456789`

3. **Click "Test Connection"** to verify

---

## Mac Setup

### Using Homebrew (Recommended)

```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install MySQL
brew install mysql

# Start MySQL
brew services start mysql

# Secure installation
mysql_secure_installation
# - Set root password: 123456789
# - Remove anonymous user: Y
# - Disable remote root: Y
# - Remove test database: Y

# Verify
mysql -u root -p
# Password: 123456789
exit
```

### Using DMG Installer

1. Download from https://dev.mysql.com/downloads/mysql/
2. Open `.dmg` file
3. Follow installation wizard
4. Set root password during setup
5. Start MySQL from System Preferences

---

## Linux Setup (Ubuntu/Debian)

```bash
# Update package manager
sudo apt update

# Install MySQL Server
sudo apt install mysql-server

# Run security script
sudo mysql_secure_installation
# - VALIDATE PASSWORD: N
# - Change root password: Y → 123456789
# - Remove anonymous users: Y
# - Disable remote root: Y
# - Remove test database: Y

# Start MySQL service
sudo systemctl start mysql

# Enable on boot
sudo systemctl enable mysql

# Verify
mysql -u root -p
# Password: 123456789
exit
```

---

## Configuration: `.env.local`

```env
# Database Connection Settings
DB_HOST=localhost           # MySQL server address
DB_USER=root                # Default MySQL user
DB_PASSWORD=123456789       # Your chosen password
DB_NAME=status_focus        # Will be auto-created

# Server Configuration
SERVER_PORT=5000            # Express.js server port
NEXT_PUBLIC_API_URL=http://localhost:5000

# Environment
NODE_ENV=development
```

**⚠️ Important**: Replace `123456789` with your actual MySQL password if you changed it during setup.

---

## Testing MySQL Connection

### Using Command Line

```bash
# Connect to MySQL
mysql -u root -p123456789

# Inside MySQL:
SHOW DATABASES;
SELECT USER();
SELECT VERSION();
exit;
```

### Using MySQL Workbench

1. Open MySQL Workbench
2. Click "+" to add new connection
3. Fill in:
   - **Connection Name**: `Status Focus`
   - **Hostname**: `localhost`
   - **Port**: `3306`
   - **Username**: `root`
   - **Password**: `123456789`
4. Click "Test Connection"
5. If successful, save and use

---

## First Time App Run

The first time you run `npm run dev`:

1. Backend server starts on port 5000
2. Detects missing database
3. **Auto-creates** `status_focus` database
4. **Auto-creates** three tables:
   - `study_sessions`
   - `daily_stats`
   - `subject_stats`
5. Ready to track!

**No manual SQL needed!** ✅

---

## Verifying Auto-Created Database

After first run, verify tables were created:

```bash
mysql -u root -p123456789

# Inside MySQL:
USE status_focus;
SHOW TABLES;
DESCRIBE study_sessions;
exit;
```

Expected output:
```
+-----------------+
| Tables_in_status_focus |
+-----------------+
| daily_stats     |
| study_sessions  |
| subject_stats   |
+-----------------+
```

---

## Troubleshooting MySQL Issues

### "Connection Refused"
```
Solution: MySQL service is not running

Windows:
  - Open Services (services.msc)
  - Find "MySQL80"
  - Click "Start"

Mac:
  brew services start mysql

Linux:
  sudo systemctl start mysql
```

### "Access Denied for user 'root'@'localhost'"
```
Solution: Wrong password in .env.local

1. Reset MySQL root password
2. Update .env.local
3. Restart app
```

### "Can't create database - Permission Denied"
```
Solution: MySQL user lacks CREATE privilege

mysql -u root -p123456789
GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
exit;
```

### "Port 3306 already in use"
```
Solution: Another MySQL instance running

Windows:
  netstat -ano | findstr :3306
  taskkill /PID <PID> /F

Mac:
  lsof -i :3306
  kill -9 <PID>

Linux:
  sudo lsof -i :3306
  sudo kill -9 <PID>
```

---

## Password Reset

If you forgot your MySQL root password:

### Windows
```bash
# Stop MySQL service
net stop MySQL80

# Start without grant tables
mysqld --skip-grant-tables

# In another CMD:
mysql -u root

# Reset password
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY '123456789';
exit;

# Restart MySQL normally
net start MySQL80
```

### Mac/Linux
```bash
# Stop MySQL
brew services stop mysql  # or: sudo systemctl stop mysql

# Start in safe mode
mysqld_safe --skip-grant-tables &

# Connect
mysql -u root

# Reset password
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY '123456789';
exit;

# Restart normally
brew services start mysql  # or: sudo systemctl start mysql
```

---

## Cloud MySQL Alternatives

Don't want to run MySQL locally? Try these:

### PlanetScale (Free)
- Free tier included
- No credit card needed
- Perfect for learning
- https://planetscale.com

Setup:
```env
DB_HOST=aws.connect.psdb.cloud
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=status_focus
```

### AWS RDS (Free tier)
- 1 year free for new accounts
- Managed service
- Auto backups
- https://aws.amazon.com/rds/

### Google Cloud SQL
- Free tier available
- Fully managed
- Easy scaling
- https://cloud.google.com/sql

### Azure Database for MySQL
- Free for 12 months
- Microsoft ecosystem
- Enterprise grade
- https://azure.microsoft.com/

---

## Best Practices

✅ **Regular Backups**
```bash
mysqldump -u root -p123456789 status_focus > backup.sql
```

✅ **Monitor Disk Space**
- Study sessions table grows over time
- Archive old data if needed

✅ **Update MySQL**
- Keep MySQL up to date for security
- Check for updates regularly

✅ **Use Strong Passwords**
- Change from `123456789` in production
- Use random 20+ character passwords

✅ **Enable Backups**
- Set up automated backups
- Test restore procedures

---

## Support Resources

- **MySQL Official Docs**: https://dev.mysql.com/doc/
- **MySQL Workbench Help**: https://dev.mysql.com/doc/workbench/en/
- **Stack Overflow**: Tag `mysql`
- **DuckDuckGo/Google**: Your specific error message

---

## Next Steps

1. ✅ Install MySQL (follow guide above)
2. ✅ Update `.env.local` with credentials
3. ✅ Run `npm install`
4. ✅ Run `npm run dev`
5. ✅ Open http://localhost:3001
6. ✅ Start studying! 📚

---

**Questions?** Check the main README.md or QUICKSTART.md

**Status Focus** - Database-backed study tracking! 💾
