const path = require("path");
const fs = require("fs");

const htmlPath = path.join(__dirname, "..", "dist", "index.html");

fs.readFile(htmlPath, "utf8", (err, data) => {
    if (err) {
        console.log(err);
        return;
    }

    const index = data.search(`src="styles.`);

    if (index > -1) {
        const output = [data.slice(0, index), "defer ", data.slice(index)].join(
            ""
        );
        fs.writeFile(htmlPath, output, "utf8", () => {
            console.log("Styles succesfully deferred");
        });
    }
});
