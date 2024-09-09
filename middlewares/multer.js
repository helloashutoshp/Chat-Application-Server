import multer from 'multer';

const multerUpload = multer({
    limits:{
        fileSize:1024 * 1024 * 5,
    },
});

const singleAvtar = multerUpload.single("avtar");
const attachmentsMulter = multerUpload.array("files")

export {singleAvtar,attachmentsMulter};