import linkedin from "../assets/linkedin.svg";
import github from "../assets/github.svg";
import behance from "../assets/behance.svg";

interface IProps {

}

const AboutUs = ({}: IProps) => {

    interface BoxProps {
        title: string;
        links?: {title: string, link: string}[];
        iconsLinks?: {icon: string, link: string}[];
    }
    const Box = ({title, links, iconsLinks}: BoxProps) => {
        return (
            <div>
                <h1 className="text-white font-SourceSerifPro md:text-xl lg:text-2xl">
                    <span className="text-transparent bg-clip-text bg-gradient-to-br from-pink-trans to-orange-trans">{title} </span> 
                    {
                        links?.map((link) => {
                            return (
                                <>
                                    <a href={link.link} className="text-white">
                                        {link.title}
                                    </a>
                                    {
                                        link !== links[links.length - 1] && ", "
                                    }
                                </>
                            )
                        })
                    }
                </h1>
                <div className="flex gap-2">
                    {
                        iconsLinks?.map((iconLink) => {
                            return (
                                <img
                                    className="w-12 h-12 cursor-pointer hover:shadow-lg transition duration-300 ease-in-out"
                                    src={iconLink.icon}
                                    alt="icon"
                                    onClick={() => window.open(iconLink.link)}
                                />
                            )})
                    }
                </div>
            </div>
        )
    }
  return (
    <div className="flex flex-col items-center font-SourceSerifPro gap-8">
        <h1 className="text-2xl text-white md:text-3xl lg:text-5xl">
            About Us
        </h1>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 w-full">
            <div className="flex flex-col gap-2">
                <h2 className="text-xl text-transparent bg-clip-text bg-gradient-to-br from-pink-trans to-orange-trans md:text-2xl lg:text-3xl">
                    Who we are?
                </h2>
                <p className="text-white font-SourceSerifPro md:text-xl lg:text-2xl">
                    We are a team of developers who are passionate about creating fun and engaging applications. Our goal is to create applications that are not only useful, but also enjoyable to use.
                </p>
            </div>
            <div className="flex flex-col gap-2">
                <h2 className="text-xl text-transparent bg-clip-text bg-gradient-to-br from-pink-trans to-orange-trans md:text-2xl lg:text-3xl">
                    What we do?
                </h2>
                <p className="text-white font-SourceSerifPro md:text-xl lg:text-2xl">
                    We create applications that are designed to make your life easier. Our applications are designed to be simple and intuitive, so you can focus on what's important.
                </p>
            </div>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 w-full">
            <Box 
                title="Original Idea by" 
                links={[{title: "Efraim Nabil", link: "https://www.linkedin.com/in/efraimnabil/"}, {title: "Heba Ezz", link: "https://www.linkedin.com/in/heba-ezz-361773250/"}]} 
            />
            <Box 
                title="Front end" 
                links={[{title: "Efraim Nabil", link: "https://www.linkedin.com/in/efraimnabil/"}]}
                iconsLinks={[{icon: linkedin, link: "https://www.linkedin.com/in/efraimnabil/"}, {icon: github, link: "https://github.com/efraimnabil"}]}
            />
            <Box 
                title="Back end" 
                links={[{title: "Gerges Hany", link: "https://www.linkedin.com/in/gergeshany/"}]}
                iconsLinks={[{icon: linkedin, link: "https://www.linkedin.com/in/gergeshany/"}, {icon: github, link: "https://github.com/GergesHany"}]}
            />
            <Box 
                title="UI UX" 
                links={[{title: "Heba Ezz", link: "https://www.linkedin.com/in/heba-ezz-361773250/"}]}
                iconsLinks={[{icon: linkedin, link: "https://www.linkedin.com/in/heba-ezz-361773250/"}, {icon: behance, link: "https://www.behance.net/hebaaezz"}]}
            />
            <Box
                title="GitHub Repository" 
                iconsLinks={[{icon: github, link: "https://github.com/efraimnabil/TODOctopus"}]}
            />
        </div>


        
    </div>
  )
}

export default AboutUs


/*             <div className="flex flex-col gap-2">
                <h2 className="text-xl text-white font-SourceSerifPro md:text-2xl lg:text-3xl">
                    Who we are?
                </h2>
                <p className="text-white font-SourceSerifPro md:text-xl lg:text-2xl">
                    We are a team of developers who are passionate about creating fun and engaging applications. Our goal is to create applications that are not only useful, but also enjoyable to use.
                </p>
            </div>
            <div className="flex flex-col gap-2">
                <h2 className="text-xl text-white font-SourceSerifPro md:text-2xl lg:text-3xl">
                    What we do?
                </h2>
                <p className="text-white font-SourceSerifPro md:text-xl lg:text-2xl">
                    We create applications that are designed to make your life easier. Our applications are designed to be simple and intuitive, so you can focus on what's important.
                </p>
            </div>*/