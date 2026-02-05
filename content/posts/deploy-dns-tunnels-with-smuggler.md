+++
date = '2026-02-05T10:07:56+03:30'
draft = false
hideSummary = true
title = 'Deploy DNS Tunnels with Smuggler'
+++
توی این آموزش میخوایم با استفاده از پروژه smuggler تونل **dnstt** و **slipstream** بیاریم بالا
### پیش‌نیاز های این آموزش
۱. ما نیاز به حداقل یه سرور خارج از ایران (آلمان، هلند، و ...) داریم (Debian/Ubuntu/RedHat/Fedora)  
۲. حداقل یه domain ترجیحا روی Cloudflare  
۳. برای استفاده از smuggler حتما باید یه سیستم لینوکسی در نقش کنترلر داشته باشیم  
۴. برای راحتی پیشنهاد میشه که از کد ادیتور‌ هایی مثل **vscode** استفاده کنید موقع کانفیگ کردن پروژه  

> اگه Windows دارید می‌تونید از **WSL2** استفاده کنید برای اینکه یه سیستم لینوکسی داخل ویندوز داشته   باشید (با یه سرچ ساده می‌تونید نصبش کنید)  

> اگه Mac دارید می‌تونید از ترمینال خودش استفاده کنید  

## نصب پیش‌نیاز ها

توی اولین قدم باید Ansible و Git رو نصب کنیم روی کنترلر  
برای Windows (**WSL2**):
```bash
# Debian/Ubuntu
sudo apt update
sudo apt install ansible git -y

# RedHat/Fedora
sudo dnf install ansible git -y
```

برای Mac:
```bash
brew install ansible git
```

برای Linux:
```bash
# Debian/Ubuntu
sudo apt update
sudo apt install ansible git -y

# RedHat/Fedora
sudo dnf install ansible git -y

# Arch-based
sudo pacman -Syy ansible git
```


بعد از نصب کردن پیش‌نیاز ها می‌ریم سراغ پروژه smuggler
پروژه رو کلون می‌گیریم:
```bash
git clone https://github.com/vayzur/smuggler.git
```
وارد مسیر پروژه می‌شیم:
```bash
cd smuggler/
```
حالا یه ls میزنیم تا ببینیم چیا داریم:
```bash
ls
```
توی خروجی باید فایل‌های پروژه رو ببینید:
```bash
LICENSE  README.md  ansible.cfg  docs  inventory  playbooks  resolvers.txt  roles  scan.sh  smuggler.yml
```
توی این آموزش ما فقط و فقط باید ۲ تا فایل توی مسیر های مشخص بسازیم و به بقیه چیزا کار نداریم

مسیر فایل اول که داخلش آیپی و اسم سرور‌هامون رو باید تعریف کنیم:
```bash
inventory/hosts.yml
```
مسیر فایل دوم که داخلش باید تونل‌هارو تعریف کنیم:
```bash
inventory/group_vars/all/tunnels.yml
```
یعنی ساختار باید اینجوری باشه:
```bash
inventory
├── group_vars
│   ├── all
│   │   ├── examples.yml
│   │   └── tunnels.yml
├── hosts.yml
└── sample.yml
```

فایل‌های `hosts.yml` و `tunnels.yml `از قبل وجود ندارن و باید بسازیم  
اینجا حالا اگه **vscode** دارید پروژه رو باهاش باز کنید:
```bash
vscode .
```

اگه **vscode** ندارید می‌تونید با هر ادیتوری این فایل هارو بسازید ولی حتما یادتون باشه که چون ساختار فایل‌ها **YAML** هست:  
> باید حتما **indent** رو رعایت کنید و حتی اگه یدونه **space** اشتباه بزنید ممکنه به مشکل بخورید

توی فایل `hosts.yml` باید آدرس سرور‌ها رو مشخص کنیم و یه اسم براشون بذاریم تا توی فایل بعدی از اسمشون استفاده کنیم  
مثال ساده:
```yaml
all:
  hosts:
    node0:
      ansible_host: 203.0.113.10
      ansible_port: 22
      ansible_user: root
      ansible_password: "your_server_password"
  children:
    server_nodes:
      hosts:
        node0:
```

همینطور که می‌بینید من یه سرور تعریف کردم به اسم `node0` و با آیپی `203.0.113.10`  
 پورت ssh که پیش‌فرض `22` هست و یوزر `root`
 ```yaml
     node0:
      ansible_host: 203.0.113.10
      ansible_port: 22
      ansible_user: root
      ansible_password: "your_server_password"
 ```

 > یوزر باید دسترسی **sudo** یا root **داشته** باشه برای راه‌اندازی تونل‌ها

نکته بعدی درمورد password‌ هست، اگه از ssh keys استفاده می‌کنید نیاز ندارید اینجا پسورد بذارید و می‌تونید این خط رو حذف کنید  
اما اگر مبتدی هستید و یا به هر دلیلی نمی‌خواید از ssh keys استفاده کنید، می‌تونید پسورد سرور رو براش مشخص کنید:  
```yaml
ansible_password: "your_server_password"
```

حالا باید سروری که تعریف کردیم رو به گروه server_nodes اضافه کنیم:  
```yaml
  children:
    server_nodes:
      hosts:
        node0:
```

هر سروری که تعریف می‌کنیم و قراره که تو نقش DNS tunnel server باشه باید به server_nodes اضافه بشه وگرنه smuggler متوجه نمیشه  

مثال از دوتا سرور:
```yaml
all:
  hosts:
    node0:
      ansible_host: 203.0.113.10
      ansible_port: 22
      ansible_user: root
      ansible_password: "your_server_password"
    node1:
      ansible_host: 203.0.113.20
      ansible_port: 22
      ansible_user: root
      ansible_password: "your_server_password"
  children:
    server_nodes:
      hosts:
        node0:
        node1:
```

حالا همون مثال ساده‌ رو توی `inventory/hosts.yml` کپی کنید  
و **آیپی سرور، یوزر، پسورد و پورت** رو با مقدار‌هایی که برای سرور خودتون هست جایگزین کنید

بعد از اینکه فایل `hosts.yml` رو ساختیم و سرور هامون رو داخلش تعریف کردیم  
میریم سراغ `tunnels.yml` که تونل‌هامون رو تعریف کنیم

> نکته: درحال حاضر هر سرور فقط می‌تونه یه نوع تونل در لحظه داشته باشه یا **dnstt** یا **slipstream**،   نمیشه جفتشون باهم روی یدونه سرور بیاد بالا (علتشم اینه که پورت `53` که مال **DNS** هست فقط یدونه هست)  
> پس به اینکه کدوم نوع تونل رو دیپلوی می‌کنید روی سرور دقت کنید تا به مشکل نخورید

خب تونل‌هارو داخل فایل `inventory/group_vars/all/tunnels.yml` رو با این ساختار تعریف می‌کنیم:
```yaml
tunnels:
  - name: tun0
    server_node: node0
    engine: dnstt
    domain: t.example.com
```

هر تونل ۴ تا فیلد اجباری داره که حتما باید مشخص بشن  
اولین فیلد `name` هست که یه اسم یکتا برای تونل باید مشخص کنیم (نباید با بقیه تونل‌ها یکی باشه)  
فیلد `server_node` مشخص کننده سروری که داخل `hosts.yml` تعریف کردیم هست و اشاره می‌کنه به اینکه روی کدوم سروری که داخل `hosts.yml` هست میخوایم این تونل بیاد بالا  
فیلد `engine` مشخص کننده نوع تونل هست و فقط دوتا مقدار رو پشتیبانی می‌کنه `dnstt` یا `slipstream`  
و در آخر فیلد `domain` که باید همون **NS record** که روی پنل **DNS** خودتون برای سرور اضافه کردید باشه  

> اگه DNS Record‌هارو هنوز روی پنل خودتون اضافه نکردید حتما این‌کارو بکنید  

```text
tns.example.com A 203.0.113.10
t.example.com NS tns.example.com.
```

بعد از اینکه تونل‌هارو تعریف کردیم حالا می‌تونیم دیپلوی کنیم:
```bash
ansible-playbook -i inventory/hosts.yml smuggler.yml
``` 

و الان باید ببینید که smuggler داره تونل‌هارو میاره بالا  
اگه اول کار به مشکل خوردید و یا connection ارور گرفتید فایل `hosts.yml` رو چک کنید تا ببینید چیزی اشتباه نباشه

و اما درمورد پروکسی یا target که وقتی پکت‌ها از کلاینت به سرور رسیدن به کجا فروارد می‌شن  
پروژه smuggler از پورت‌های پیش‌فرض هر تونل استفاده می‌کنه  
برای **slipstream** پورت `target` روی `5201` ست شده  
و برای **dnstt** روی `7000`  

اگر می خواید پورت هدف رو تغییر بدید تا تونل پکت‌هارو به مقصد دیگه‌ای فروارد کنه
باید تونل‌هارو رو آپدیت کنید:
```yaml
tunnels:
  - name: tun0
    server_node: node0
    engine: dnstt
    domain: t.example.com
    server:
	  target_port: 8080
```

بعد از تغییر دادن تونل‌ها توی فایل `tunnels.yml` حتما باید این تغییرات رو روی سرور هم اعمال کنیم:
```bash
ansible-playbook -i inventory/hosts.yml smuggler.yml --tags server-tunnels
``` 
اینجوری فقط تونل‌ها آپدیت می‌شن
و به همین سادگی مقصد پکت‌ها تغییر می‌کنه

## پروکسی

به طور کلی پروژه smuggler هدفش فقط راه اندازی DNS tunneling هست و قرار نیست proxy بیاره بالا  
یعنی شما از قبل باید یه پروکسی روی اون پورت مقصد بیارید بالا و بعدش تونل‌هارو راه اندازی کنید  
پروکسی می‌تونه هرچیزی که TCP هست باشه مثل: Xray, Sing-box, SSH socks, و ...  

اینم اضافه کنم که پروژه smuggler درحال حاضر می‌تونه SSH socks proxy هم بیاره بالا  
و برای استفاده از این قابلیت کافیه که تونل‌های خودتون رو به این صورت آپدیت کنید:

اول از هر چیزی باید `ssh_proxy` رو فعال کنیم(پیش‌فرض غیرفعال هست):
```yaml
ssh_proxy: true
```
و یه فیلد proxy به تونل اضافه کنیم:
```yaml
ssh_proxy: true

tunnels:
  - name: tun0
    server_node: node0
    engine: dnstt
    domain: t.example.com
    server:
	  target_port: 8080
	  proxy:
	    - name: proxy1
	      remote_addr: 127.0.0.1
	      remote_port: 22
```

حالا می‌تونیم به smuggler بگیم تا پروکسی رو هم بیاره بالا:
```bash
ansible-playbook -i inventory/hosts.yml smuggler.yml --tags proxy
```

> اینو بگم که socks proxy اصلا گذینه امنی نیست چون encryption نداره و یا حتی authentication  
> فقط برای تست یا استفاده شخصی ازش استفاده کنید  
> روی پروداکشن از پروکسی‌هایی مثل Xray, Sing-box, Shadowsocks, و ... استفاده کنید که امن تر باشن

## چجوری وصل بشیم؟

توی این آموزش فقط برای دسکتاپ مثال می‌زنیم که چجوری میشه وصل شد  

نیاز داریم باینری‌های `dnstt-client` یا `slipstream-client` رو روی دسکتاپ خودمون داشته باشیم  
برای dnstt رو می‌تونید از این لینک دانلود کنید: [dnstt](https://github.com/net2share/dnstt/releases/tag/latest) 

و برای slipstream از این اینجا: [slipstream](https://github.com/net2share/slipstream-rust-build/releases/tag/latest)

اگه تونل dnstt هست نیاز داریم که public key که برای تونل هست رو به کلاینت بدیم  
پروژه smuggler به طور پیش‌فرض private key و public key رو داخل این مسیر قرار میده:
```bash
/opt/dnstt.key # private key
/opt/dnstt.pub # public key
```
یه بار ssh بزنید به سرور و اونو کپی کنید:
```bash
cat /opt/dnstt.pub

# abcd...
```

قبل از ران کردن کلاینت مطمئن بشید که قابلیت اجرایی داره:
```bash
chmod +x dnstt-client
```

و حالا کلاینت رو ران کنید:
```bash
dnstt-client -udp 8.8.8.8:53 -pubkey 4d77f7e4... t.example.com 127.0.0.1:1080
```

بعد از اینکه کلاینت رو ران کردید برای تست اینکه تونل کار می‌کنه یا نه  
یه **HTTP request** بهش می‌زنیم:
```bash
curl --proxy socks5h://127.0.0.1:1080 http://ifconfig.me

# 203.0.113.10
```
اگه ریکوست با موفق از تونل رد بشه باید IP سرور خودتون رو بهتون برگردونه

و اگه تونل slipstream آوردید بالا به همین صورت:
```bash
chmod +x slipstream-client
```

کلاینت رو ران کنید:
```bash
slipstream-client -l 1080 -r 8.8.8.8:53 -d t.example.com -t 200
```

و یه ریکوست بهش بزنید:
```bash
curl --proxy socks5h://127.0.0.1:1080 http://ifconfig.me

# 203.0.113.10
```

علت اینکه ما اینجا از پروکسی نوع socks استفاده کردیم این بود که بالاتر گفتیم که می‌تونیم از SSH socks proxy برای تست استفاده کنیم  
می‌تونید با مرورگر یا تلگرام هم بهش کانکت بشید  
## چجوری تونل رو از روی سرور حذف کنیم؟

۱. برای دیدن وضعیت سرویس اون تونل:
```bash
systemctl status smuggler@tun0.service
```
۲. برای stop کردن تونل:
```bash
systemctl stop smuggler@tun0.service
```
۳. برای restart کردن تونل:
```bash
systemctl restart smuggler@tun0.service
```
۴. حذف کردن تونل از روی سرور:
```bash
systemctl stop smuggler@*.service

rm /etc/systemd/system/smuggler@*.service

systemctl daemon-reload
```
۵. حذف کردن پروکسی‌ها از روی سرور:
```bash
systemctl stop proxy@*.service

rm /etc/systemd/system/proxy@*.service

systemctl daemon-reload
```

>  اینجا `*` به معنی اسم اون تونل هست و اگه همین رو بزنید در واقع تمام تونل‌ها یا پروکسی‌ها حذف می‌شن

اگه خواستید بیشتر با پروژه آشنا بشید می‌تونید به داکیومنت پروژه مراجعه کنید:
[smuggler](https://github.com/vayzur/smuggler)
