import keyboard
import requests
import time
import threading

min_request_interval = 0.5 # Tempo mínimo entre as solicitações (em segundos)
last_request_time = 0 # Variável para rastrear o tempo da última solicitação
interval_check_presentation = 1
hotkey_active = False

# Função para enviar a requisição POST
def send_data_to_api(type):
    global last_request_time
    current_time = time.time()

    # Verifica se o tempo mínimo passou desde a última solicitação
    if current_time - last_request_time >= min_request_interval:
        url = f"http://localhost:3000/api/slide/{type}/0"

        try:
            response = requests.post(url)
            if response.status_code == 200:
                print("Requisição POST enviada com sucesso!")
            else:
                print(f"Erro ao enviar a requisição POST. Código de status: {response.status_code}")
        except Exception as e:
            print(f"Erro ao enviar a requisição POST: {str(e)}")

        # Atualiza o tempo da última solicitação
        last_request_time = current_time
    else:
        print("Aguarde o tempo mínimo entre as solicitações!")

# Função para enviar a requisição GET
def check_presentation_active():
    global hotkey_active
    try:
        response = requests.get("http://localhost:3000/presentation_active")
        if response.status_code == 200:
            presentation_active = response.text.strip().lower()
            if presentation_active == 'true':
                if hotkey_active == False:
                    print("Ativando Hotkey...")
                    keyboard.add_hotkey('left', send_data_to_api, args=("previous",), suppress=True)
                    keyboard.add_hotkey('right', send_data_to_api, args=("next",), suppress=True)
                    hotkey_active = True
            elif presentation_active == 'false':
                if hotkey_active:
                    print("Desativando Hotkey...")
                    keyboard.remove_hotkey('left')
                    keyboard.remove_hotkey('right')    
                    hotkey_active = False        
        else:
            print(f"Erro ao fazer a requisição GET. Código de status: {response.status_code}")

        timerCheckPresentation = threading.Timer(interval_check_presentation, check_presentation_active)
        timerCheckPresentation.start()
    except Exception as e:
        print(f"Erro: {str(e)}")

# Lê as variáveis de configuração do arquivo config.txt
with open('config.txt', 'r') as config_file:
    config_data = config_file.readlines()

config = {}
for line in config_data:
    key, value = line.strip().split('=')
    config[key.lower()] = value

# Verifica se a chave "hotkey" está definida como "true" no arquivo de configuração
if config.get('hotkey', '').lower() != 'true':
    print("A chave 'hotkey' não está definida como 'true'. Saindo do programa.")
    exit()

# Obtém os valores das teclas "previous" e "next" do arquivo de configuração
htk_previous = config.get('htk_previous', 'a')
htk_next = config.get('htk_next', 'd')

# Define o hotkey para as teclas "previous" e "next" que chama a função de envio
keyboard.add_hotkey(htk_previous, send_data_to_api, args=("previous",))
keyboard.add_hotkey(htk_next, send_data_to_api, args=("next",))

check_presentation_active()

# Inicia o loop para captura de teclas
keyboard.wait()