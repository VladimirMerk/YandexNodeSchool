# YandexNodeSchool

Разметка и функционал реализованы в соответвии с заданием.
В работе использован фреймворк jQuery версии 1.12.4, загружаемый из CDN Google.


1. Инициализация

Объект формы сделан универсальным, без привязки к конкретным элементам по id. Id формы и контейнера вывода передаются аргументами при создании объекта.

Если элементы не переданы, или не найдены на странице, используются значения по умолчанию (#myForm, #resultContainer)
Если не найден ни один элемент, объект создаётся но не функционирует. При этот метод, возвращающий объект с данными формы возвращает пустой объект.


2. Установка данных

Метод setData принимает объект с данными формы и устанавливает их только допустимым полям, определённым массивом validFields (по умолчанию fio, email и phone)


3. Получение данных

Метод getData возвращает объект с данными абсолютно всех input-полей формы, где имена свойств совпадают с именами полей. Пробелы в начале и конце значений поля удаляются. Исключения составляют типы полей button, submit и reset.


4. Валидация

Валидации подвергаются только поля определённые массивом validFields с именами fio, email и phone в случае их наличия. Любые другие поля считаются валидными по умолчанию.

Поле fio считается валидным, если строка не пустая и состоит из руских, или английских слов количество которых регулируется переменной maxWord (по умолчанию 3), длиной более одной буквы.

Поле email считается валидным, если строка не пустая и cостоит из двух частей, разделённых символом @. Левая часть (имя ящика) проверяется на валидность в соостветсвии со спецификацией html5. Правая чать (домен) проверяется на соответвие допустимым доменам, определённым массивом allowedDomains

Поле phone считается валидным, если строка не пустая и начинается на +7, имеет формат +7(999)999-99-99, а сумма всех чисел не превышает значение переменной maxSum (по умолчанию 30)


5. Отправка формы

Перед отправкой данных формы происходит валидация полей и если проверка пройдена, отправляется ajax запрос на url определённый в параметре формы action (по умолчанию success.json). При этом все кнопки формы получают аттрибут disabled.

Запрос ограничен по времени пятью секундами. В случае таймаута контейнер вывода получает статус ошибки (класс error) и соответствующее сообщение. Любые ошибки передачи и получения данных обрабатываются так же.

При успешном получении данных поведение реализовано в соответвии с заданием.
