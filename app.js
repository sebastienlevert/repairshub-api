const express = require('express'),
    swaggerUi = require('swagger-ui-express'),
    fs = require('fs'),
    cors = require('cors'),
    YAML = require('yaml');

var path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

// Sample data
let repairs = [
    {
        id: 1,
        title: 'Oil change',
        description: 'Need to drain the old engine oil and replace it with fresh oil to keep the engine lubricated and running smoothly.',
        assignedTo: 'Karin Blair',
        date: '2023-05-23',
        image: 'https://www.howmuchisit.org/wp-content/uploads/2011/01/oil-change.jpg'
    },
    {
        id: 2,
        title: 'Brake repairs',
        description: 'Conduct brake repairs, including replacing worn brake pads, resurfacing or replacing brake rotors, and repairing or replacing other components of the brake system.',
        assignedTo: 'Issac Fielder',
        date: '2023-05-24',
        image: 'https://upload.wikimedia.org/wikipedia/commons/7/71/Disk_brake_dsc03680.jpg'
    },
    {
        id: 3,
        title: 'Tire service',
        description: 'Rotate and replace tires, moving them from one position to another on the vehicle to ensure even wear and removing worn tires and installing new ones.',
        assignedTo: 'Kat Larsson',
        date: '2023-05-24',
        image: 'https://th.bing.com/th/id/OIP.N64J4jmqmnbQc5dHvTm-QAHaE8?pid=ImgDet&rs=1'
    },
    {
        id: 4,
        title: 'Battery replacement',
        description: 'Remove the old battery and install a new one to ensure that the vehicle start reliably and the electrical systems function properly.',
        assignedTo: 'Ashley McCarthy',
        date: '2023-05-25',
        image: 'https://i.stack.imgur.com/4ftuj.jpg'
    },
    {
        id: 5,
        title: 'Engine tune-up',
        description: 'This can include a variety of services such as replacing spark plugs, air filters, and fuel filters to keep the engine running smoothly and efficiently.',
        assignedTo: 'Cecil Folk',
        date: '2023-05-28',
        image: 'https://th.bing.com/th/id/R.e4c01dd9f232947e6a92beb0a36294a5?rik=P076LRx7J6Xnrg&riu=http%3a%2f%2fupload.wikimedia.org%2fwikipedia%2fcommons%2ff%2ff3%2f1990_300zx_engine.jpg&ehk=f8KyT78eO3b%2fBiXzh6BZr7ze7f56TWgPST%2bY%2f%2bHqhXQ%3d&risl=&pid=ImgRaw&r=0'
    },
    {
        id: 6,
        title: 'Suspension and steering repairs',
        description: 'This can include repairing or replacing components of the suspension and steering systems to ensure that the vehicle handles and rides smoothly.',
        assignedTo: 'Daisy Phillips',
        date: '2023-05-29',
        image: 'https://i.stack.imgur.com/4v5OI.jpg'
    },
];
let maxId = repairs.length + 1;

const file = fs.readFileSync(path.join(__dirname, 'repairs-openapi.yml'), 'utf8')
const jsonOpenApiDoc = YAML.parse(file);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(jsonOpenApiDoc));

app.use(express.json());

app.get('/.well-known/ai-plugin.json', function (req, res) {
    res.sendFile(path.join(process.cwd(), '/.well-known/ai-plugin.json'));
});

app.get('/logo.png', function (req, res) {
    res.sendFile(path.join(process.cwd(), 'logo.png'));
})
  

app.get('/', function (req, res) {
    res.redirect('/api-docs');
});

// Define routes
app.get('/repairs', (req, res) => {
    let filteredRepairs = repairs;

    let assignedTo = req.query.assignedTo;
    if (assignedTo) {
        assignedTo = assignedTo.toLowerCase().trim();
        // Break assignedTo into first and last name and search for both   
        const nameParts = assignedTo.split(' ');
        filteredRepairs = repairs.filter(repair => repair.assignedTo?.toLowerCase().includes(nameParts[0]?.trim()) || repair.assignedTo?.toLowerCase().includes(nameParts[1]?.trim()));
    }

    res.status(200).json(filteredRepairs);
});

app.post('/repairs', (req, res) => {
    const { title, description, assignedTo, date, image } = req.body;
    const id = maxId;
    maxId++;
    const newRepair = { id, title, description, assignedTo, date, image };
    repairs.push(newRepair);
    res.status(201).send('New repair created');
});

app.patch('/repairs', (req, res) => {
    let { id, title, description, assignedTo, date, image } = req.body;
    const repairIndex = repairs.findIndex(repair => repair.id === parseInt(id));
    if (repairIndex > -1) {
        date = date ?? repairs[repairIndex].date;
        title = title ?? repairs[repairIndex].title;
        description = description ?? repairs[repairIndex].description;
        image = image ?? repairs[repairIndex].image;
        assignedTo = assignedTo ?? repairs[repairIndex].assignedTo;
        const updatedRepair = { id, title, description, assignedTo, date, image };
        repairs[repairIndex] = updatedRepair;
        res.status(200).send('Repair updated');
    } else {
        res.status(404).send('Repair not found');
    }
});

app.delete('/repairs', (req, res) => {
    const repairIndex = repairs.findIndex(repair => repair.id === parseInt(req.body.id));
    if (repairIndex > -1) {
        repairs.splice(repairIndex, 1);
        res.status(200).send('Repair deleted');
    } else {
        res.status(404).send('Repair not found');
    }
});

app.get('/openapi.yml', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(jsonOpenApiDoc);
});

app.use(express.static(__dirname + '/public'));

// // Start the server
// app.listen(port, () => {
//     console.log(`Repairs API listening at http://localhost:${port}`);
// });

module.exports = app;


