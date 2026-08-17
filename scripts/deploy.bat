@echo off
REM =============================================================================
REM Windows 部署脚本 (Batch)
REM =============================================================================
REM 使用方法:
REM   deploy.bat <动作> [参数]
REM
REM 动作:
REM   package     - 打包部署包
REM   upload      - 上传到服务器 (需要指定包名)
REM   deploy      - 完整部署（打包 + 上传）
REM   update      - 更新服务器（打包 + 上传 + 自动更新）
REM   status      - 查看服务状态
REM   logs        - 查看日志
REM   restart     - 重启服务
REM
REM 示例:
REM   deploy.bat package
REM   deploy.bat deploy
REM   deploy.bat upload server-dist-xxx.tar.gz
REM =============================================================================

setlocal enabledelayedexpansion

REM 配置变量
set SERVER_USER=deploy
set SERVER_HOST=your-server.com
set SERVER_DIR=/opt/server

REM 颜色设置（Windows 10+）
for /F %%a in ('echo prompt $E ^| cmd') do set "ESC=%%a"
set "BLUE=%ESC%[94m"
set "GREEN=%ESC%[92m"
set "YELLOW=%ESC%[93m"
set "RED=%ESC%[91m"
set "NC=%ESC%[0m"

REM 检查参数
if "%1"=="" goto :help
if "%1"=="help" goto :help
if "%1"=="package" goto :package
if "%1"=="upload" goto :upload
if "%1"=="deploy" goto :deploy
if "%1"=="update" goto :update
if "%1"=="status" goto :status
if "%1"=="logs" goto :logs
if "%1"=="restart" goto :restart
if "%1"=="backup" goto :backup
if "%1"=="rollback" goto :rollback

echo %RED%未知命令: %1%NC%
goto :help

:help
echo.
echo %BLUE%Windows 部署脚本%NC%
echo.
echo 用法: deploy.bat ^<动作^> [参数]
echo.
echo 动作:
echo   package     - 打包部署包
echo   upload      - 上传到服务器 (需要指定包名)
echo   deploy      - 完整部署（打包 + 提示上传）
echo   update      - 更新服务器（打包 + 上传 + 自动更新）
echo   status      - 查看服务状态
echo   logs        - 查看日志
echo   restart     - 重启服务
echo   backup      - 创建备份
echo   rollback    - 回滚到上一版本
echo.
echo 示例:
echo   deploy.bat package
echo   deploy.bat deploy
echo   deploy.bat upload server-dist-xxx.tar.gz
echo   deploy.bat update
echo.
goto :end

:package
echo %BLUE%开始打包...%NC%
echo.

REM 清理 dist 目录
if exist dist (
    rmdir /s /q dist
    echo 已清理 dist 目录
)

REM 构建项目
echo %BLUE%构建项目...%NC%
call pnpm build
if errorlevel 1 (
    echo %RED%构建失败%NC%
    exit /b 1
)
echo %GREEN%构建完成%NC%

REM 生成版本号
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set "datetime=%%I"
set "VERSION=%datetime:~0,8%_%datetime:~8,6%"
set "PACKAGE_NAME=server-dist-%VERSION%.tar.gz"

echo.
echo %BLUE%创建部署包: %PACKAGE_NAME%%NC%

REM 创建部署包
tar -czf "%PACKAGE_NAME%" dist node_modules package.json prisma .env

if errorlevel 1 (
    echo %RED%打包失败%NC%
    exit /b 1
)

REM 获取文件大小
for %%A in ("%PACKAGE_NAME%") do set "SIZE=%%~zA"
set /a "SIZE_MB=!SIZE! / 1048576"

echo.
echo ==========================================
echo %GREEN%打包成功!%NC%
echo ==========================================
echo 文件名: %PACKAGE_NAME%
echo 大小: !SIZE_MB! MB
echo.
echo 下一步操作:
echo   deploy.bat upload %PACKAGE_NAME%
echo 或
echo   deploy.bat deploy
echo ==========================================

goto :end

:upload
if "%2"=="" (
    echo %RED%错误: 请指定部署包%NC%
    echo 用法: deploy.bat upload ^<包名^>
    exit /b 1
)

set "PACKAGE=%2"

if not exist "%PACKAGE%" (
    echo %RED%文件不存在: %PACKAGE%%NC%
    exit /b 1
)

echo %BLUE%上传部署包到服务器...%NC%
echo 服务器: %SERVER_USER%@%SERVER_HOST%
echo 文件: %PACKAGE%
echo.

scp "%PACKAGE%" %SERVER_USER%@%SERVER_HOST%:/tmp/

if errorlevel 1 (
    echo %RED%上传失败%NC%
    exit /b 1
)

echo.
echo %GREEN%上传完成!%NC%
echo.
echo 请在服务器上执行:
echo   ssh %SERVER_USER%@%SERVER_HOST%
echo   cd %SERVER_DIR%
echo   ./manage.sh backup
echo   sudo tar -xzf /tmp/%PACKAGE%
echo   npx prisma migrate deploy
echo   ./manage.sh restart

goto :end

:deploy
echo %BLUE%开始完整部署流程...%NC%
echo.

call :package

echo.
set /p "CONFIRM=是否立即上传到服务器? (y/N): "
if /i "!CONFIRM!"=="y" (
    call :upload "%PACKAGE_NAME%"
) else (
    echo.
    echo %BLUE%稍后可以运行:%NC%
    echo   deploy.bat upload %PACKAGE_NAME%
)

goto :end

:update
echo %BLUE%开始更新服务器...%NC%
echo.

call :package

echo.
set /p "CONFIRM=是否立即更新服务器? (y/N): "
if /i not "!CONFIRM!"=="y" (
    echo 取消更新
    goto :end
)

echo %BLUE%上传部署包...%NC%
scp "%PACKAGE_NAME%" %SERVER_USER%@%SERVER_HOST%:/tmp/

if errorlevel 1 (
    echo %RED%上传失败%NC%
    exit /b 1
)

echo %GREEN%上传完成，开始在服务器上更新...%NC%
echo.

REM 通过 SSH 执行服务器命令
ssh %SERVER_USER%@%SERVER_HOST% "cd %SERVER_DIR% && ./manage.sh backup && sudo tar -xzf /tmp/%PACKAGE_NAME% && npx prisma migrate deploy && ./manage.sh restart && rm /tmp/%PACKAGE_NAME% && echo 更新完成"

if errorlevel 1 (
    echo %RED%服务器更新失败%NC%
    exit /b 1
)

echo.
echo %GREEN%服务器更新完成!%NC%

goto :end

:status
echo %BLUE%查看服务状态...%NC%
ssh %SERVER_USER%@%SERVER_HOST% "cd %SERVER_DIR% && pm2 status"
goto :end

:logs
echo %BLUE%查看服务日志...%NC%
ssh %SERVER_USER%@%SERVER_HOST% "cd %SERVER_DIR% && pm2 logs server --lines 100 --nostream"
goto :end

:restart
echo %BLUE%重启服务...%NC%
ssh %SERVER_USER%@%SERVER_HOST% "cd %SERVER_DIR% && ./manage.sh restart"
goto :end

:backup
echo %BLUE%创建备份...%NC%
ssh %SERVER_USER%@%SERVER_HOST% "cd %SERVER_DIR% && ./manage.sh backup"
goto :end

:rollback
echo %YELLOW%回滚到上一版本...%NC%
ssh %SERVER_USER%@%SERVER_HOST% "cd %SERVER_DIR% && ./manage.sh rollback"
goto :end

:end
echo.
endlocal
