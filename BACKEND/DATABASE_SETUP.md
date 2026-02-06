# PRAYAS2026 Backend - Database Configuration

## Database Details

**Database Provider:** Render.com PostgreSQL  
**Database Name:** prayas2026  
**Host:** dpg-d62rk3ur433s73a1514g-a.oregon-postgres.render.com  
**Port:** 5432  
**Username:** prayas2026_user  

## Connection URLs

### Internal (Private) Connection
```
postgresql://prayas2026_user:IYI9rIK1xQTvt9zooJ844Bw4LN2ZQukS@dpg-d62rk3ur433s73a1514g-a/prayas2026
```

### External (Public) Connection
```
postgresql://prayas2026_user:IYI9rIK1xQTvt9zooJ844Bw4LN2ZQukS@dpg-d62rk3ur433s73a1514g-a.oregon-postgres.render.com/prayas2026
```

### PSQL Command
```bash
PGPASSWORD=IYI9rIK1xQTvt9zooJ844Bw4LN2ZQukS psql -h dpg-d62rk3ur433s73a1514g-a.oregon-postgres.render.com -U prayas2026_user prayas2026
```

## Setup Instructions

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Create .env File
Copy `.env.example` to `.env` and verify the database credentials are set correctly:
```bash
cp .env.example .env
```

The `.env` file should contain:
```
DATABASE_URL=postgresql://prayas2026_user:IYI9rIK1xQTvt9zooJ844Bw4LN2ZQukS@dpg-d62rk3ur433s73a1514g-a.oregon-postgres.render.com/prayas2026
DB_HOST=dpg-d62rk3ur433s73a1514g-a.oregon-postgres.render.com
DB_PORT=5432
DB_NAME=prayas2026
DB_USER=prayas2026_user
DB_PASSWORD=IYI9rIK1xQTvt9zooJ844Bw4LN2ZQukS
SECRET_KEY=your-secret-key-here
```

### 3. Run the Application
```bash
python app.py
```

## Testing Database Connection

To test if your database connection is working:

```python
# In Python shell
from database_config import test_database_connection
success, message = test_database_connection()
print(message)
```

Or use the PSQL command directly:
```bash
PGPASSWORD=IYI9rIK1xQTvt9zooJ844Bw4LN2ZQukS psql -h dpg-d62rk3ur433s73a1514g-a.oregon-postgres.render.com -U prayas2026_user prayas2026
```

## Environment Variables

The application uses the following environment variables (in `.env` file):

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | Full PostgreSQL connection string | Yes |
| `DB_HOST` | Database hostname | No (if DATABASE_URL is set) |
| `DB_PORT` | Database port | No (if DATABASE_URL is set) |
| `DB_NAME` | Database name | No (if DATABASE_URL is set) |
| `DB_USER` | Database username | No (if DATABASE_URL is set) |
| `DB_PASSWORD` | Database password | No (if DATABASE_URL is set) |
| `SECRET_KEY` | Flask secret key | Yes |
| `FLASK_ENV` | Environment type (development/production) | No |
| `FLASK_DEBUG` | Debug mode | No |

## Important Security Notes

⚠️ **Never commit the `.env` file to version control!**
- The `.env` file contains sensitive credentials and should never be pushed to GitHub
- The `.gitignore` file is configured to ignore `.env`
- Always use `.env.example` as a template for new environments
- Use different passwords for different environments (dev, staging, production)

## Troubleshooting

### Connection Refused
- Verify the database host is accessible from your network
- Check firewall settings
- Ensure the username and password are correct

### Authentication Failed
- Double-check the password in `.env`
- Verify the username is `prayas2026_user`

### Network Issues
- If connecting from outside the Render network, use the external connection URL
- For internal/private connections within Render, use the internal URL (no .oregon-postgres.render.com)

## Database Schema

See `database_schema.sql` in the project root for the complete database schema.

## Additional Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Flask-SQLAlchemy Documentation](https://flask-sqlalchemy.palletsprojects.com/)
- [Render PostgreSQL Documentation](https://render.com/docs/databases)
