import {Request,Response} from 'express'
import cloudinary from '../config/cloudinary.js'


class reportController{

    async uploadReport(req:Request,res:Response){

      
        try{

            if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "CSV file is required"
            });
        }



            const result=await new Promise((resolve,reject)=>{

                const uploadStream=cloudinary.uploader.upload_stream({resource_type:"image",folder:"trace-x-ai"},
                    (error,result)=>{
                         if (error) {
                            console.error("FULL CLOUDINARY ERROR:");
                            console.dir(error, { depth: null });
                            console.log("CLOUDINARY ERROR MESSAGE:", error.message);
                            reject(error);
                        } else {
                            console.log("CLOUDINARY SUCCESS:");
                            console.dir(result, { depth: null });
                            resolve(result);
                        }

                    }


                )

                console.log("Uploading file to Cloudinary...");

                uploadStream.end(req.file!.buffer)

            })
           

            return res.status(200).json({
                success:true,
                message:"Report uploaded successfully",
                data:result
            })



        }
        catch(error){
                console.error("CLOUDINARY ERROR:", error);


            return res.status(500).json({
                success:false,
                message:"Error uploading report",
                error:error
            })
        }






    }






}

export default new reportController()