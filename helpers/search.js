module.exports = (query) => {
    let objectSearch = {
        keyword: "",
        regex: ""
    }

    if(query.keyword){
        objectSearch.keyword = query.keyword.trim(); // Loại bỏ khoảng trắng thừa
        const keywords = objectSearch.keyword.split(/\s+/); // Tách thành các từ khóa

        // Tạo regex với mỗi từ khóa để tìm tất cả các từ khóa trong title
        const regex = new RegExp(keywords.map(k => `(?=.*${k})`).join(""), "i"); 
        objectSearch.regex = regex;
    }
    return objectSearch

}