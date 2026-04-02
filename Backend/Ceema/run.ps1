Get-Content .env | ForEach-Object { $k,$v = $_ -split '=',2; $env:$k = $v }
venv\Scripts\activate
python manage.py runserver
