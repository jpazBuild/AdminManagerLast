


export const httpMethodsStyle = (methodName: string,darkMode:boolean=false) => {


    const optionsColor = [
        { name: "GET", color: "bg-green-100 text-green-700 font-semibold rounded-full px-2"+(darkMode?" bg-green-100/90":"") },
        { name: "POST", color: "bg-yellow-100 text-yellow-700 font-semibold rounded-full px-2"+(darkMode?" bg-yellow-100/90":"") },
        { name: "PUT", color: "bg-blue-100 text-blue-700 font-semibold rounded-full px-2"+(darkMode?" bg-blue-100/90":"") },
        { name: "PATCH", color: "bg-purple-100 text-purple-700 font-semibold rounded-full px-2"+(darkMode?" bg-purple-100/90":"") },
        { name: "DEL", color: "bg-red-100 text-red-700 font-semibold rounded-full px-2"+(darkMode?" bg-red-100/90":"") },
        { name: "OPTIONS", color: "bg-pink-100 text-pink-700 font-semibold rounded-full px-2"+(darkMode?" bg-pink-100/90":"") },
    ];

    const method = optionsColor.find((option) => option.name === methodName);

    if (!method) {
        return "bg-gray-100 text-gray-700";
    }

    return method.color;

} 